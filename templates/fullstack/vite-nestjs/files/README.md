# `__PROJECT_NAME__`

通用前后端工程：React 19 + Vite 6 + NestJS 11 + TypeScript。根目录是独立 pnpm workspace，包含 `web/` 和 `server/`。

## 安装与开发

需要 Node.js 22.12+、pnpm >=10.18.3 <11。

生成项目不携带模板的 pnpm-lock.yaml（包含子包）；首次安装按本机平台和 package.json 重新解析依赖并生成自己的锁文件。后续可提交新锁文件用于项目自身的可重复构建。

```sh
corepack enable
pnpm install --no-frozen-lockfile
pnpm dev
```

前端为 <http://127.0.0.1:5173>，后端为 <http://127.0.0.1:7001>。首页调用健康接口，展示连接状态和重试按钮。开发请求由 Vite 代理到后端，需同时启动两端；单独启动可用 `pnpm dev:web`、`pnpm dev:server`。`pnpm dev:all` 是 `pnpm dev` 的别名。

前端不固定端口时 Vite 可能自动换端口；反向代理固定到 7001，若修改后端 PORT，需同时修改 `web/vite.config.ts` 中代理目标。浏览器请求封装位于 `web/src/lib/request.ts`，支持 RequestInit（包括取消信号）和 timeoutMs，默认 15 秒超时；非 2xx 抛 HttpError，204 返回 undefined，其余解析 JSON。

首页包含独立 LineChart、AsyncSearchSelect 示例、中英切换和服务端时钟。通用组件、请求/时间/国际化、增强 OSS 和文件日志的完整 API 见 [通用能力说明](docs/reusable.md)。示例数据不代表实际服务指标。

## 构建、运行和校验

```sh
pnpm typecheck
pnpm build
pnpm start
```

build 构建两端并把 `web/dist/` 复制到 `server/public/`。start 从工程内启动 NestJS，同时托管静态页面、SPA 路由和 API；工作目录无需设置环境变量即可使用 dev 默认值。生产运行设置 `APP_ENV=prod NODE_ENV=production`。这些是进程环境变量，PowerShell 等终端请使用对应设置方式。

HTTP 入口：

| 路径                 | 内容                           |
| -------------------- | ------------------------------ |
| `/check`             | `{ "status": "ok" }`，存活检查 |
| `/api/health`        | 服务名、环境与时间戳           |
| `/runtime-config.js` | 不缓存的公开浏览器配置脚本     |
| `/`                  | 构建后的前端页面               |

未提供业务自动化测试或 lint 脚本；类型检查和构建不能替代业务测试。新增业务后按实际行为补充测试。

## 配置与环境

服务端读取 `docker/env.dev.yaml`、`docker/env.prod.yaml`。按 `APP_ENV` → `SPRING_PROFILES_ACTIVE` → `dev` 选择环境，仅支持 dev/prod；同名进程环境变量覆盖 YAML。`APP_ENV` 由选择器生成，不要在 YAML 内重复声明。可通过 `APP_CONFIG_DIR` 指定外部配置目录。

YAML 使用 `environment` 下的分组与标量字段；字段名必须大写且不可跨组重复。默认端口 7001、API_BASE_URL=/api、OSS 关闭。不会自动读取 `.env` 文件。容器通过 `SPRING_PROFILES_ACTIVE=prod` 默认选择 prod，可继续覆盖该变量，或用更高优先级的 APP_ENV 选择环境。部署环境注入私有配置，不把凭证写回仓库。

`/runtime-config.js` 在入口页面加载前注入 `window.RUNTIME_CONFIG`，只公开 `API_BASE_URL`，允许同一前端构建切换 API 地址。它明确返回 JavaScript 类型与 `Cache-Control: no-store`。API_BASE_URL 应指向 API 根路径，例如 `/api` 或 `https://api.example.com/api`。其它环境参数与 OSS 凭证不传到浏览器。

默认通过 Vite 代理或服务端同源托管访问 API。需要跨域时配置 `CORS_ORIGIN`，多个精确来源用逗号分隔；不要将它当作鉴权机制。

## 可选 OSS 与 ENC 配置

`server/src/oss/` 保留通用 ali-oss 注入、对象创建/读取/列举/更新/删除、bucket 白名单和延迟客户端。默认 `OSS_ENABLED=false`，启动不要求云账号；未启用时调用服务会明确报错。

启用时由部署系统注入：

- `OSS_ENABLED=true`。
- `OSS_ENDPOINT`、`OSS_BUCKET_NAME`、`OSS_ACCESS_KEY_ID`、`OSS_ACCESS_KEY_SECRET` 为必填。
- `OSS_ALLOWED_BUCKET_NAMES` 是逗号分隔白名单，默认只允许默认 bucket。
- `OSS_REGION` 可选；无法从 endpoint 推断 region 时必填。
- `OSS_STS_TOKEN` 可选；`JASYPT_PASSWORD` 用于兼容已有 ENC 值。

`server/src/config/jasypt-decryptor.ts` 保留源工程两种 AES-CBC `ENC(...)` 格式的解密兼容。明文凭证也可通过环境注入；加密值在首次实际创建 OSS 客户端时解密。解密兼容不等于密钥管理，解密密码同样只由部署系统提供。本模板未提供公开上传接口或连接真实云资源的示例。

## 独立打包

```sh
pnpm build
pnpm package
cd package-output
node dist/main.js
```

package 会重新创建 `package-output/`（只在构建前端与服务端后运行），包含生产依赖、dist、public 和两份公开 YAML，可脱离原 workspace 运行。打包使用 pnpm 10 的 `deploy --legacy --prod`，不需要运行环境安装 pnpm。构建结果、依赖、server/public 和 package-output 都不应回写模板基础目录。

## Docker 与 CI

```sh
docker build -f docker/Dockerfile.package --target package --output type=local,dest=./package-output .
docker build -f docker/Dockerfile -t my-app ./package-output
docker run --rm -p 7001:7001 my-app
```

第一步在 Linux 容器构建并导出独立包，第二步以非 root 用户在 7001 端口运行，健康检查访问 `/check`。根 `.dockerignore` 用于源码构建；独立包保留 public，运行镜像应以 package-output 作为 context。不要把 macOS 本机 node_modules 拷入 Linux 容器。

`docker/Jenkinsfile` 保留通用构建/发布流水线示例。需在自己的 Jenkins 配置仓库、凭证 ID、镜像仓库及部署仓库；`docker/deploy.values.yaml` 是外部渲染器使用的示例。名为 Deploy 的阶段仅检出仓库并替换 manifest 占位符，未执行集群部署，需由团队接入实际部署系统。Docker 和 Jenkins 的实际可用性应在自己的 runner 验证。
