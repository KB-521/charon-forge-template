# `__PROJECT_NAME__`

Umi Max 4 / React 18 / Ant Design 5 后台工程。包含布局、路由、权限/模型/请求示例、通用表格、图片/文件预览、Excel 提交弹窗、字典、CSV 导出和常用工具。默认演示模式不需要后端，构建后的静态文件也可以独立运行。

## 开始使用

要求 Node.js 22.12+、pnpm 10.18.3；依赖来自公共 npm registry，pnpm-lock.yaml 锁定精确解析结果。

```sh
pnpm install --frozen-lockfile
pnpm dev
```

浏览器打开终端显示的地址，默认 http://localhost:8000。安装后 postinstall 会运行 max setup，生成 src/.umi；不要把该目录提交到版本控制。没有公司 SDK、私服、登录账号或后端依赖。

```sh
pnpm lint
pnpm lint:fix
pnpm typecheck
pnpm test
pnpm build
pnpm preview
```

preview 默认 http://127.0.0.1:4173，可通过 PORT 覆盖。dev 同样支持 PORT。preview 仅用于本地检查静态产物，生产使用自己的静态服务器。

## 目录与能力

| 路径                             | 内容                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------ |
| config/                          | Umi 插件、路由、布局与显式开发代理                                             |
| src/app.tsx、access.ts           | 初始用户、布局、前端权限与统一请求配置                                         |
| src/services/                    | demo / api 服务适配；Http.Res 为 success + data，列表为 data.list / data.total |
| src/components/MetaSheet/        | 输入/选择/树/日期筛选、排序、分页、选择、操作、刷新                            |
| src/components/Form/             | 可控 NormalUpload / ImageUpload，校验后注入传输                                |
| src/components/ExcelUploadModal/ | Excel 文件选择、提交状态和回调；不绑定业务                                     |
| src/hooks/                       | 行选择、字典、导出与弹窗状态                                                   |
| src/utils/                       | 文件大小/后缀校验、下载、复制、URL、JSON、图片加载                             |
| public/runtime-config.js         | 浏览器可见的运行时配置                                                         |
| scripts/                         | 公开配置生成及 SPA 预览                                                        |
| docker-config/                   | 开发/生产公开运行时配置（.env.dev、.env.prod）                                 |
| docker/                          | 静态部署示例，无自动 push/部署                                                 |

工作台包含 model 状态示例。数据列表使用原工程迁移的 MetaSheet；上传页展示三种文件交互；资料页演示当前页面会话的资料修改；/admin 默认由前端 access 拦截，/403 和未知路径分别展示 403/404。

## 代码规范

ESLint 使用 eslint.config.mjs 接入 @charonix/eslint-config@1.2.0，启用 React、TypeScript、Tailwind 规则。pnpm lint 要求零警告，pnpm lint:fix 自动整理代码；使用该配置的格式规则维护源码，避免其它格式化器来回覆盖。

保留 Node 原生测试，不启用 Vitest 的测试导入替换规则；Umi 生成目录、dist、自动生成的 public/runtime-config.js 不参与 lint。

## 接入自己的服务

默认 public/runtime-config.js 的 MODE 为 demo。演示数据在浏览器内，不是远端服务或认证系统；资料仅在当前页面会话中有效，Excel 仅演示接收文件，不解析/导入业务数据。上传默认使用本地 object URL 预览，页面销毁或移除文件后回收。

保留 docker-config 目录作为配置入口：pnpm dev / pnpm config:runtime 读取 docker-config/.env.dev，pnpm build / pnpm config:runtime:prod 读取 docker-config/.env.prod。两份都是受控的浏览器公开配置，不包含源工程的 LOGIN_HOST 或公司地址。

可自行创建被忽略的 docker-config/.env.local 覆盖公开配置；该文件不随模板发布。进程环境变量优先于配置文件，可配置以下字段：

| 变量             | 默认         | 用途                                              |
| ---------------- | ------------ | ------------------------------------------------- |
| APP_NAME         | 生成的项目名 | 页面标题/布局名                                   |
| APP_MODE         | demo         | demo 或 api                                       |
| API_BASE_URL     | /api         | 同源路径或不带凭据的 HTTP(S) 接口根地址           |
| API_PROXY_TARGET | 不启用       | 在启动进程环境中设置，只用于 dev 的 /api 代理目标 |

pnpm dev / build 会先生成 public/runtime-config.js；也可执行 pnpm config:runtime。该脚本只导出 APP_NAME、MODE、API_BASE_URL，不导出整个 dotenv 或进程环境。配置会出现在浏览器，不能存放任何密码、私钥或访问令牌。

静态部署后可替换 dist/runtime-config.js 而不重新构建；更改 docker-config 配置需要重新执行对应环境的配置生成，并将生成的 public/runtime-config.js 复制到 dist 对应位置。SPA 路由前缀仍属于 Umi 构建配置，不属于运行时接口配置。

API 模式保留如下示例契约，按自己的后端修改 services/index.ts：

- GET /records：pageIndex/pageSize/name/status/sortField/sortOrder/日期范围，返回 success + data.list/total。
- GET /users/me 与 PUT /users/me：返回用户资料与 permissions。
- GET /dictionaries/:key：返回 value/label 数组。
- POST /records/export：接收 idList，返回 Blob。

baseURL 统一由 requestErrorConfig 注入。业务失败使用 success=false + message，HTTP/业务错误统一提示。没有自动 SSO、Cookie 拦截器或预置认证；服务器必须实现实际认证和授权，前端 access 只控制页面显示。生产同源 /api 需要配置自己的反向代理，开发代理不进入静态产物。

## 复用组件

MetaSheet 的 requestInterface 接收分页/筛选/排序参数并返回 Http.PageRes；默认以 id 作为稳定行标识。topActionRender / actionRender 接收选择数据和 refreshSheet，ref 提供 refresh/rawData。列表更换页大小、查询与重置会回到第一页，列宽计算不修改传入 columns。

NormalUpload / ImageUpload 使用 value、onChange 控制文件列表；upload(file, signal) 可返回 { url, key? } 以接入服务器，默认只本地预览。maxFileSize 单位 MB，maxSize 限制数量；默认图片 PNG/JPG/JPEG/WEBP/GIF，普通文件 PDF/XLSX/XLS。客户端大小和后缀校验仅用于交互，服务器需自行校验内容和访问权限。

ExcelUploadModal 使用 visible、submit(file)、onFormSave(result)、onCancel；大小/后缀校验后才提交，提交中禁用重复操作。替换 submit 即可接入自己的导入 API。

useDictList 与 useExport 通过通用服务接入字典和导出。CSV 生成会转义引号和公式前缀，下载 URL 会回收。

## 部署

```sh
docker build -f docker/Dockerfile -t umi-admin:local .
docker run --rm -p 8080:8080 umi-admin:local
```

镜像使用非 root nginx，支持 SPA fallback。默认 /api 返回 404；接入 API 时配置代理或公开 API_BASE_URL。可将运行时配置文件只读挂载到 /usr/share/nginx/html/runtime-config.js。Docker 命令仅为示例，实际平台兼容性以自己的构建验收为准。
