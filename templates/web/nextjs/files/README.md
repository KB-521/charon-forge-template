# __PROJECT_NAME__

Next.js App Router 项目，使用 TypeScript、Tailwind CSS 和 Ant Design。默认以普通 Next.js 服务运行，无需账号、后端或云存储配置。

## 环境与启动

- Node.js 22.12+
- pnpm >=10.18.3 <11（使用本机版本，不固定 packageManager）

生成项目不携带模板的 pnpm-lock.yaml（包含子包）；首次安装按本机平台和 package.json 重新解析依赖并生成自己的锁文件。后续可提交新锁文件用于项目自身的可重复构建。

```sh
corepack enable
pnpm install --no-frozen-lockfile
pnpm dev
```

打开 <http://localhost:3000>。首页包含一个本地消息按钮，不请求远程业务服务。

## 本地、测试与线上环境

`APP_ENV` 区分部署环境，独立于 Next.js 管理的 `NODE_ENV`。支持 local、test、production，兼容原工程 ci（映射 test）及 prod（映射 production）写法；未识别的环境值会报错。

| 环境 | 开发 | 构建 | 启动已构建服务 | 配置前缀 |
| --- | --- | --- | --- | --- |
| 本地 | `pnpm dev` | `pnpm build:local` | `pnpm start:local` | `LOCAL_` |
| 测试 | `pnpm dev:test` | `pnpm build:test` 或 `pnpm build:ci` | `pnpm start:test` | `TEST_` |
| 线上 | — | `pnpm build` 或 `pnpm build:production` | `pnpm start` | `PRODUCTION_` |

按需在生成项目中创建 `.env.local`，或由 CI/部署系统注入相应变量。只读取所选环境的前缀，测试配置不回退使用线上地址：

- `*_API_PROXY_TARGET`：后端根地址，`/api/:path*` 转发到该地址的 `/api/:path*`；留空关闭代理。
- `*_ASSET_PREFIX`：CDN 地址或以 `/` 开头的资源前缀；留空使用当前站点，不自动上传文件。
- `*_IMAGE_REMOTE_ORIGINS`：逗号分隔的图片源站，如 `https://images.example.com`；按协议、域名和端口生成白名单。
- `*_ALLOWED_DEV_ORIGINS`：逗号分隔的开发访问域名；不写死个人内网地址。

例如测试部署只填写 `TEST_API_PROXY_TARGET`、`TEST_ASSET_PREFIX` 等变量，再运行 `pnpm build:test`。这些 Next 配置在构建时确定，测试和线上分别构建，启动命令与构建环境保持一致。所有产物写入 `.next/`，切换环境会覆盖前一次构建；`start:test` 不会转换已有线上产物。

本地图片不启用 Next 优化，测试和线上保留内置图片优化；仅线上移除普通 console，保留 error/warn。原有五分钟代理超时与视频资源导入能力保留，默认开发/构建使用 webpack。浏览器可读取 `process.env.NEXT_PUBLIC_APP_ENV`，后端代理地址不通过 env 配置暴露给浏览器。

Next.js 的 `.env.*` 加载仍遵循其标准 `NODE_ENV` 规则；不要为了测试部署设置 `NODE_ENV=test`，也不要将部署测试环境与测试运行器的 `.env.test` 混用。详见[官方环境变量说明](https://nextjs.org/docs/app/guides/environment-variables)。

## Docker 运行时公开配置

`docker-config/.env.dev`、`docker-config/.env.prod` 延续原工程的键值文件和 `window.CONFIG` 机制，样例保留 `ENV`、`BASE_URL`，业务域名由生成项目填写。文件位于 docker-config 子目录，由配置路由显式读取，不参与 Next.js 根目录的 dotenv 自动加载。

| 选择方式 | 文件 | 浏览器标记 |
| --- | --- | --- |
| `SPRING_PROFILES_ACTIVE=dev` | `docker-config/.env.dev` | `window.CONFIG.ENV === 'DEV'` |
| `SPRING_PROFILES_ACTIVE=prod` | `docker-config/.env.prod` | `window.CONFIG.ENV === 'PROD'` |
| 未指定，APP_ENV 为 local/test/ci | `docker-config/.env.dev` | `DEV` |
| 未指定，APP_ENV 为 production/prod | `docker-config/.env.prod` | `PROD` |

保留原 Docker 变量 `SPRING_PROFILES_ACTIVE`，显式指定时优先于 APP_ENV；只接受 dev/prod。Docker 镜像需将 `docker-config/` 一并复制到应用工作目录，启动时通过环境变量选择文件，也可挂载该目录。普通 Next 服务直接读取文件，不再使用 Nginx 对静态 HTML 执行 sed 替换。

`/runtime-config.js` 是不缓存的 Node Route Handler，每次读取所选文件。根布局使用 `beforeInteractive` 加载脚本，在页面交互前设置只读、冻结的 `window.CONFIG`。文件缺失、ENV 与所选环境不符、BASE_URL 为空或选择变量非法时，配置接口明确失败；修改文件后刷新页面即可重新读取。

```dotenv
# docker-config/.env.dev（示例）
ENV=DEV
BASE_URL=https://api.example.com/api
```

`BASE_URL` 包含 API 前缀，默认 `/api` 表示同源请求。request 地址优先级为：单次 `baseURL` → `initRequest` 的显式 `baseURL` → 浏览器 `window.CONFIG.BASE_URL` → `/api`。服务端不读取 window，需要为实例提供绝对地址。

这两个文件的所有键都会公开到浏览器，值均为字符串；可按项目需要扩展键，但不要放凭据或密钥。配置解析支持注释与引号，不执行 shell，也不展开变量引用。只有选中公开文件的内容会返回，服务端 `process.env` 不会整体暴露。

同一构建产物可通过 dev/prod 文件切换浏览器 API 地址。Next 的代理规则、CDN、图片白名单及 `NEXT_PUBLIC_APP_ENV` 仍由构建时 APP_ENV 决定；修改这些配置必须重建。若跨环境复用产物，应使用运行时绝对 API 地址，并确保构建时资源配置适用于目标环境。参考 [Next.js 运行时环境变量说明](https://nextjs.org/docs/app/guides/environment-variables#runtime-environment-variables)和 [beforeInteractive 加载说明](https://nextjs.org/docs/app/api-reference/components/script#beforeinteractive)。

## 检查与生产运行

```sh
pnpm lint
pnpm lint:fix
pnpm typecheck
pnpm build
pnpm start
```

`typecheck` 先生成路由类型，支持全新安装后直接执行。`build` 输出到 `.next/`，`start` 需要先完成构建。没有预置自动化测试，也不提供 `test` 占位命令。

ESLint 使用 `eslint.config.js` 引用 `@charonix/eslint-config@1.2.0`，启用 React、TypeScript 和 Tailwind 规则。`lint` 要求零警告，`lint:fix` 按该配置自动整理格式；不要再用其它格式化器覆盖其代码风格。TypeScript 使用满足配置包 React 插件要求的 5.3.3。

## 目录

```text
docker-config/
├── .env.dev               # 开发/测试运行时公开配置
└── .env.prod              # 线上运行时公开配置
src/
├── app/
│   ├── layout.tsx        # 服务端根布局、metadata、Ant Design SSR 样式
│   ├── runtime-config.js/route.ts # 不缓存的运行时配置脚本
│   ├── providers.tsx     # Ant Design 主题和 App 消息上下文
│   ├── page.tsx          # 起始页
│   ├── not-found.tsx     # 404
│   ├── error.tsx         # 页面错误与重试
│   └── globals.css       # 基础样式与 Tailwind
├── components/
│   └── starter-action.tsx
└── lib/
    ├── request.tsx       # 响应解包、可选缓存、错误处理、下载与地址映射
    └── utils.ts          # cn() 类名合并
```

## 开始开发

- 替换 `src/app/page.tsx`，在 `layout.tsx` 中调整站点标题、描述和语言。
- 在 `providers.tsx` 中修改 Ant Design token，在 `tailwind.config.ts` 中维护页面颜色。Ant Design reset 已启用，Tailwind preflight 关闭。
- `request` 保留原工程的响应处理方式，默认解包 `{ code: 2000, data, message }`，业务失败拒绝原始响应，网络失败保留 Axios 错误。错误提示通过 Ant Design App 上下文接入，不直接使用静态 message。
- `cn()` 用于合并条件类名。按需添加业务组件、接口和状态管理。
- 默认不需要环境变量即可启动首页；构建环境参数通过自行创建的 `.env.local` 或部署变量接入，运行时公开配置通过 `docker-config/.env.dev`、`.env.prod` 接入。凭据只放服务端，避免使用 `NEXT_PUBLIC_` 暴露密钥。
- 默认保留 SSR、Route Handler 等服务能力；如果需要静态导出，应另行配置 `output: 'export'` 并调整运行方式。
- 保留原工程的轻量国际化工具和少量中英文通用词条；用户体系、数据库、分析上报和部署供应商由应用接入。

## 请求封装

```ts
import request, { initRequest, requestWithMapBaseURL } from '@/lib/request';

// 默认读取 window.CONFIG.BASE_URL，未注入时使用 /api；GET 支持 data 查询参数。
const result = await request<{ id: number }>({ url: '/example', data: { id: 1 } });

// 默认不缓存，显式启用时缓存成功响应五分钟；支持 GET/POST 查询。
await request({ url: '/example', cache: true });
await request({ url: '/example', cache: { ttl: 60_000 } });

// 与原入口一致，支持错误回调和第三参数关闭错误提示。
await request({ url: '/example' }, (error) => console.error(error), true);

// 文件名从 Content-Disposition 解析，不再绑定某个业务 URL。
const { blob, name } = await request({ url: '/export', responseType: 'blob' });

// 非统一响应协议可按次取原始响应；也可以为另一后端配置 successCode。
const raw = await request<{ value: string }>({ url: '/external', rawResponse: true });
const alternate = initRequest(undefined, { baseURL: 'https://example.com/api', successCode: 0 });

// 保留原服务地址映射能力。
const mapped = requestWithMapBaseURL(new Map([['/report', 'https://example.com']]), request);
```

`loginCheckNeed: false` 只关闭登录过期回调，不把鉴权失败当作成功。使用 `setRequestLoginExpired`、`setRequestPermissionDenied` 或 `initRequest` 的 options 接入自己的登录/权限处理；注册函数返回清理函数。默认不跳转、不弹登录框或购买框。

缓存键包含地址、方法、参数、请求体、语言和显式鉴权头；multipart、下载及 rawResponse 不缓存。Cookie 登录发生账号切换时调用 `request.clearCache()`。服务器上使用绝对 baseURL，并为每个请求创建独立实例，避免共享用户缓存；凭据不要硬编码。

## 从原工程保留的通用能力

- `components/DisableWrapper`、`TooltipTitle`、`SmoothMutation`、`NoMore`：保留原组件结构与职责，解除多余依赖并补齐客户端边界。
- `hooks/useEvent`、`useInit`、`useStateMayOutControl`、`hooks/(utils)/useInterval`、`useMobile`：事件、受控状态、条件初始化、定时器和设备判断。
- `utils/array`、`color`、`copy`、`client`、`location`、`mediaType` 与 `lib/calc`：原数组、颜色、剪贴板、浏览器地址、媒体分类及二维计算工具。
- `lib/i18n`：保留 `getLocale/setLocale/t`、词条插值和 Ant Design locale 适配。默认中文，切换默认刷新页面，storage key 改为 `app-locale`；首页没有预设多语言路由，工具可按需接入。

使用 [Next.js 文档](https://nextjs.org/docs) 添加路由与服务能力。Ant Design 的 App Router 样式注册方式参考[官方接入说明](https://ant.design/docs/react/use-with-next/)。
