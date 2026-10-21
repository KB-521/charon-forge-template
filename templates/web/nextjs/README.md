# Next.js 模板

通用 Next.js App Router 工程：Next.js 16.2.2、React 19.2.4、TypeScript、Tailwind CSS 3、Ant Design 5。采用普通 Next.js 服务模式，保留 SSR 与后续服务端扩展能力。

模板包含中性起始页、本地消息交互、404、页面错误重试和 Ant Design SSR 样式注册，并保留原工程通用请求封装、基础组件、hooks、工具函数及轻量国际化。移除真实业务页面、公司 SDK、私有服务配置、云存储上传和分析上报。

请求层保留原有调用方式、`code/data` 解包、可选缓存、错误提示/回调、下载及 baseURL 映射；登录过期与权限异常保留接入回调，去除产品弹窗、购买和跳转。完整能力见 [工程说明](files/README.md)。

Next 配置保留 local/test/production 环境切换、各环境 API 代理/CDN 前缀/图片白名单、开发访问域名、代理超时、线上日志压缩和视频导入。使用 APP_ENV 区分部署环境，具体变量见 [环境配置说明](files/README.md#本地测试与线上环境)；测试与线上分别使用 build:test/build（对应 start:test/start）。

运行时公开配置保留 `docker-config/.env.dev`、`.env.prod` 和原 Docker 变量 `SPRING_PROFILES_ACTIVE=dev/prod`，通过不缓存的 `/runtime-config.js` 在交互前注入 `window.CONFIG`，默认 request 自动读取 BASE_URL。未设置选择变量时按 APP_ENV 匹配 dev/prod；部署时需保留 docker-config 目录，详见[运行时配置说明](files/README.md#docker-运行时公开配置)。

## 生成与开发

Node.js 22.12+、pnpm 10.18.3。先审查并将模板纳入 Git，再在仓库根目录执行：

```sh
pnpm template:dev --template nextjs --output ../nextjs-dev --name my-next-app
```

随后进入 `../nextjs-dev`：

```sh
corepack enable
pnpm install --no-frozen-lockfile
pnpm dev
```

安装、开发、构建只在仓库外生成的工程运行，不在 `files/` 中执行。生成项目的完整说明见 [files/README.md](files/README.md)。

## 发布与验证

- projectName 只显式渲染 package.json 与生成工程 README，锁文件不包含项目名 token。
- 使用 node 安装适配器和 pnpm 锁定安装。
- `verify` 包括安装、lint、路由类型生成/类型检查和生产构建；不启动常驻服务。
- `publish.include` 包含基础文件，归档仍只读取已跟踪且通过安全检查的文件。

```sh
pnpm templates:validate
pnpm verify:templates --template nextjs --native
```

默认没有自动化测试。补充业务时按实际行为建立测试；模板检查不等同于目标应用测试。
