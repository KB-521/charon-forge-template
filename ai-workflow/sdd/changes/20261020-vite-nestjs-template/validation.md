# 实施与验证记录

本文件记录 REQ-001 初次迁移；后续通用能力与组件补充见 [REQ-002 验证记录](reuse-validation.md)。

## 最终范围

- 新增 `templates/fullstack/vite-nestjs`，版本 0.1.0，包含 42 个工程负载文件、template.json、维护 README 和 CHANGELOG。
- 保留原项目 React/Vite、NestJS、pnpm workspace、健康检查、运行时公开配置、OSS 读写/白名单、ENC 解密兼容、Docker/Jenkins 示例。
- 统一 Node 22.12+、pnpm 10.18.3；从原锁文件迁移，锁文件不包含来源包名或项目名 token。
- 清理来源名称、固定启动密码、镜像源绑定；不导入私有环境文件、未跟踪地球瓦片、依赖、构建结果及 AI 协作资料。
- 默认 OSS 关闭，显式开启后校验配置；延迟客户端忽略 Nest 生命周期与 thenable 探测，避免启动时意外实例化。
- 前端起始页展示 API 连接、失败和重试；服务端配置脚本明确 MIME/no-store，只公开 API_BASE_URL；运行时全局名为 `window.RUNTIME_CONFIG`，避免与模板 token 语法冲突。
- 配置选择为 APP_ENV → SPRING_PROFILES_ACTIVE → dev。Docker 以旧变量默认选择 prod，保留 APP_ENV 优先与旧部署变量覆盖能力。
- 独立打包包含生产依赖、静态页面与 YAML；同步根 README、AGENTS 和开发说明。

## 实际执行

环境：macOS，Node v22.23.2、pnpm 10.18.3。

所有安装、类型检查、构建和服务启动只在仓库外临时工程执行；没有在模板 files 内安装或构建。

| 检查                                                                                  | 结果                                                                     |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `pnpm templates:validate`                                                             | 通过；发现 Next.js 与 vite-nestjs 两个模板，每个归档 43 个条目           |
| `pnpm verify:templates --template vite-nestjs --native`                               | 通过；锁定安装、前后端类型检查、生产构建、独立打包、再次生成和摘要防污染 |
| `pnpm template:dev --template vite-nestjs --name fullstack-check --output <临时目录>` | 通过；真实协议生成、项目名渲染与 local-dev 来源记录                      |
| 生成工程 `pnpm install --frozen-lockfile`、`pnpm build`、`pnpm package`               | 通过；单独打包后再复制到与 workspace 无关的目录运行                      |
| 最终文档调整后 `pnpm verify:templates --template vite-nestjs`                         | 通过；README 项目名 token 和 Docker 环境选择变更重新进入归档/生成检查    |
| `git diff --check` 与临时 index 中的 staged diff check                                | 通过                                                                     |
| 原工程白名单 30 个文件 SHA-256                                                        | 全部与迁移前一致；来源 Git 状态仍只有已有的 packages 未跟踪目录          |
| 真实 `.git/index` SHA-256                                                             | 与验证前一致；未将新文件暂存到用户工作区                                 |
| 模板运行产物、链接、本地环境值、来源名称检查                                          | 通过；负载内无依赖、dist、public、package-output、符号链接或源项目配置值 |

模板归档要求 Git 跟踪白名单。本次使用临时 `GIT_INDEX_FILE` 从 HEAD 建立检查快照，只将新模板加入该临时 index，未改变真实暂存区，也未提交任何内容。之后维护者正常使用模板命令前，需按仓库约定先审查并纳入 Git。

## HTTP 与配置行为

通过仓库外临时检查脚本执行 11 组行为验证，每组完成后终止子进程：

1. 独立服务默认无 OSS 凭证即可启动，`/check` 与 `/api/health` 正常，服务标识渲染为 fullstack-check-server。
2. `/runtime-config.js` 返回 JavaScript 类型与 no-store，只有公开 API_BASE_URL，不包含注入的私有占位值。
3. 生产 HTML、JS/CSS 资源和深层 SPA 路由正常；`/api` 与未定义 API 返回 JSON 404；默认不开启跨域。
4. prod 环境选择、API_BASE_URL 进程覆盖、脚本中的小于号/行分隔符转义和显式 CORS 来源均正常。
5. SPRING_PROFILES_ACTIVE=prod 兼容旧环境选择。
6. APP_ENV=dev 优先于 SPRING_PROFILES_ACTIVE=prod。
7. OSS 开启并注入明确标记的占位参数后，启动仍保持延迟客户端，不连接云资源。
8. 非法环境选择在启动时失败。
9. OSS 开启但缺少必填字段时启动失败。
10. 非法 PORT 在启动时失败。
11. 实际启动 Vite 与 NestJS 开发进程，代理 `/api/health`、`/check`、`/runtime-config.js` 均通过。

验证完成后已停止全部子进程。没有执行真实云存储调用或发布，也没有新增假业务测试。

## 限制与观察

- `docker info` 返回无法连接本机 Docker daemon，因此没有执行容器构建/启动；Jenkins 和实际集群部署未验证。
- pnpm 10 的 legacy deploy 会提示使用旧打包实现；一次临时验证还出现 yaml 命令链接警告。独立包已实际移出 workspace 启动，YAML 读取与全部 HTTP 检查通过；模板不依赖 yaml CLI。
- 浏览器页面完成类型检查、构建和静态资源/代理 HTTP 检查，未进行浏览器视觉验收。
- ENC 解密算法按来源保留，仅统一格式；未对真实密文或云凭证进行验证。
- 未自动暂存、提交或发布。方案索引为 DES-FE-20261020-002、DES-BE-20261020-002，见 [设计索引](design/INDEX.md)。

## Agent 与 skill

- Agent：requirement-manager → design-manager → implementation-executor。
- 实际流程 skill：req-dev、req-create、brainstorming、writing-plans。
- 模板迁移没有命中专用实现 skill，依据仓库模板协议与贡献/开发说明实施；未启用并行 worker。
