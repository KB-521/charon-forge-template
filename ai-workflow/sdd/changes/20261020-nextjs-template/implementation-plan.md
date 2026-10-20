# Next.js Template Implementation Plan

**Goal:** 将已导入的真实项目裁剪为独立可安装、可构建的 Next.js 模板。

**Architecture:** 使用普通 Next.js 服务模式与 App Router，服务端根布局保留 SSR，客户端只挂载 Ant Design 配置和消息上下文。首页与错误页面公开访问，不调用后端；请求层提供通用 Axios 实例，不预设鉴权和业务响应码。

**Tech Stack:** Next.js 16.2.2、React 19.2.4、TypeScript、Tailwind 3、Ant Design 5、ESLint、pnpm 10.18.3。

## 已确认边界

用户后续指定将 docker-config/env.dev、env.prod 改为 .env.dev、.env.prod。同步读取路径、文件追踪与文档，根仓库和生成项目的 Git 忽略规则只为两份公开文件添加例外；打包/解包协议仅放行 docker-config/.env.dev、docker-config/.env.prod 两个精确路径，其它真实 dotenv 文件保持禁止。

2026-10-20 用户明确不需要 `.env.example`，移除该模板文件及模板内的 Git 忽略例外，同步 README 引用。构建变量仍可由部署系统注入或在生成项目中按需创建 `.env.local`；保留 docker-config/env.dev、env.prod 运行时配置。

2026-10-20 用户要求迁移原 docker-config 下 env.dev/env.prod 机制。保留 dev/prod 键值文件、SPRING_PROFILES_ACTIVE 和只读 window.CONFIG；通过独立、不缓存的 Node Route Handler 在交互前加载，保持页面预渲染能力，避免根布局全部动态化或构建时冻结运行配置。公开样例仅保留 ENV/BASE_URL，可自行扩展，不搬入产品域名、产品开关或旧部署脚本凭据。构建配置继续由 APP_ENV 控制。

2026-10-20 用户指出 nextConfig 的环境分支不应删除。恢复 APP_ENV=local/test/production，兼容 ci/prod；通过不同前缀的公开配置样例区分代理、CDN、图片白名单和开发来源，保留代理超时、线上日志清理、视频资源导入。保持普通 Next.js 服务模式，替换原域名与个人内网地址，不接回公司 OSS 上传插件。开发和构建显式使用 webpack，cross-env 用于跨平台设置环境，作为启动命令所需的运行依赖分发。

2026-10-20 用户指定 ESLint 改为引用 `@kingboss666/eslint-config`。实际接入版本 1.1.1，入口改为 eslint.config.js，并声明 package type=module；移除原 eslint-config-next。其 React 插件 peerDependencies 不接受 TypeScript 5.1.6，因此调整为 5.3.3。源码按新配置整理格式、补齐注释，保留原功能。

2026-10-20 用户纠正裁剪范围：原项目通用工程能力应保留，明确要求保留 request 处理。后续以本条为准，不再以“19 文件最小骨架”为目标。先恢复原请求封装的调用方式、响应解包、可选缓存、错误回调、下载与 baseURL 映射，删除的仅为公司 SDK、业务跳转和产品接口特例；通用组件、hooks、工具及轻量国际化按依赖逐项恢复。用户可以进一步指定保留范围。

用户于 2026-10-20 回复“好 你来处理吧”，授权按 DES-FE-20261020-001 及上一轮推荐进入实现。采用通用模板、保留 Ant Design/Tailwind、普通 Next.js 服务模式；首版不带国际化、鉴权、状态库和额外业务示例。保持主要框架版本，不同步进行升级。

业务逻辑：打开首页展示中性起始说明；本地示例按钮显示消息；404 返回首页；渲染错误可重试。不需要接口和 mock；删除原 API，不添加人为数据契约。字段规则仅为模板 projectName，沿用 CLI/schema 的公开标识符约束，并显式渲染 package.json 与 README。

## Task 1 备份与源码裁剪

- 将现有 `templates/web/nextjs/files/` 整体移动到仓库外独立备份目录，保留原始源码、锁文件与产物。
- 重建 `files/src/app/{layout.tsx,providers.tsx,page.tsx,not-found.tsx,error.tsx,globals.css,icon.svg}`。
- 新建 `files/src/components/starter-action.tsx`，只包含本地消息交互。
- 保留并精简 `files/src/lib/utils.ts`，建立 `files/src/lib/request.ts`；移除原业务、素材、SDK 与工具残留。

## Task 2 工程与模板协议

- 重写 `files/{package.json,next.config.ts,tsconfig.json,eslint.config.mjs,tailwind.config.ts,postcss.config.mjs,.gitignore,README.md}`。
- 保留跨平台 `dev/build/start/lint/typecheck` 命令。移除失效 test 命令，使用最小公开依赖集。
- 更新 `templates/web/nextjs/{template.json,README.md,CHANGELOG.md}`，填写 Node/pnpm 要求、node 安装适配器、项目名 token 与 verify argv。
- 在仓库外生成副本，安装依赖并生成锁文件；仅将审查后的锁文件同步回 files。

## Task 3 隔离验证

- 使用本机已安装 Node 22 与 pnpm 10.18.3，不改变全局默认版本。
- 在仓库外临时 Git 仓库纳入模板副本，用真实 pack/generate 流程验证，避免更改用户当前 Git 暂存区。
- 验证命令：`pnpm templates:validate`、`pnpm verify:templates --template nextjs --native`，在临时仓库运行原仓库工具脚本。verify 包括锁定安装、lint、build、typecheck。
- 生成工程验证项目名替换、依赖来自公开包源、构建成功、首屏输出含内容与 Ant Design 样式，以及源码摘要不变。
- 无需启动长期服务；不创建实现镜像测试或空测试资产。

## Task 4 文档与交付

- 更新根 README、templates README 与 AGENTS 中“没有内置模板”的过期说明，仅修改对应事实。
- 在当前 SDD 变更包记录备份位置、最终文件/依赖数量、校验结果和环境限制。
- 同步变更入口、设计索引与 SDD 索引，检查空白、残留业务标识、发布边界及模板文件污染。
- 不提交 Git，不发布，不变更用户已有暂存内容。
