# Umi 模板迁移与验证记录

对应需求 REQ-001；方案索引ID DES-FE-20261021-001。2026-10-21 本机串行完成，未提交、推送或发布。来源 `/Users/king/Desktop/app-1` 只读，83 个文件 SHA-256 与任务开始快照一致；真实 Git index 摘要不变。未修改用户原有 README 技能说明或技能文件。

## 来源能力与处理

| 来源能力 | 模板处理 | 使用入口 |
| --- | --- | --- |
| Umi Max、React、Ant Design / Pro Components、ahooks、Tailwind | 沿用主版本，公共 registry 精确版本与锁文件 | package.json、config/、tailwind.css |
| 布局、路由、initialState、access、model、request | 公共 Logo、工作台/列表/上传/资料/403/404，demo/API 统一适配 | src/app.tsx、access.ts、models/、requestErrorConfig.ts |
| MetaSheet、行选择 | 保留输入/选择/树/日期/范围筛选、排序、分页、操作与 ref；修复响应解包、空数值、页重置、列对象污染 | components/MetaSheet、hooks/useRow |
| 图片/普通文件上传 | 去除平台 OSS 签名，受控文件列表、大小/后缀校验、upload(file, signal)；默认本地预览，回收 object URL | components/Form、pages/Uploads |
| 业务 Excel 导入 | 改为 submit(file) 注入、校验、加载/失败反馈；示例只接收文件，不解析或导入业务数据 | components/ExcelUploadModal |
| 字典、导出 | 通用服务；CSV 字段引号与公式前缀处理，Blob 下载后回收 URL | hooks/useDictList、useExport、utils/download |
| URL、JSON、图片、复制工具 | 保留可独立复用工具，URL 参数按普通自有属性处理 | src/utils |
| 公司 SSO SDK、固定 AES、用户/密码及专用业务接口 | 移除；API 契约改为 /records、/users/me、/dictionaries；实际认证授权由使用者服务器实现 | src/services |
| 私服、内网代理、公司 Logo、真实 env、生产发布脚本 | 不复制；公共 registry、本地 SVG、显式开发代理、公开运行时 allowlist、静态部署示例 | .npmrc、public/、scripts/、docker/ |

## 标准模板

- 路径 templates/web/umi；id umi，category web，layout single，version 0.1.0；Node 22.12+ / pnpm 10.18.3，node 安装适配器。
- 实际负载 59 个文件，校验器报告 60（包含 template.json）；7 项内容渲染清单与所有 projectName token 文件一致。生成工程项目名 umi-check，验证器项目名 verify-project。
- Umi Max 4.7.25、React 18.3.1、Ant Design 5.29.3、Pro Components 2.8.10、ahooks 3.10.0、Tailwind 3.4.19、TypeScript 5.9.3；精确依赖与公开 pnpm 锁文件，不修改根依赖或 CLI 协议/版本。
- public/runtime-config.js 在 bundle 前加载，只公开 APP_NAME / MODE / API_BASE_URL。dev/build 先生成配置；静态部署可替换该文件，无需重新构建。
- 默认 demo 在浏览器运行，不启动假服务，不连接公司资源。API 模式和上传回调为接入点；模板本身不提供服务器、登录、云存储或远端持久化。

## 实际执行结果

所有依赖安装、运行、测试、构建均在仓库外临时工程进行；模板 files 内无 node_modules、dist 或 src/.umi*。使用临时 GIT_INDEX_FILE 选择新增模板，不暂存真实 index。

| 检查 | 结果与覆盖 |
| --- | --- |
| pnpm templates:validate | 4 个模板通过；Umi 描述、渲染与发布文件边界正确 |
| pnpm template:dev --template umi --name umi-check | 仓库外生成成功，包名、布局与公开配置完成渲染 |
| pnpm verify:templates --template umi --native | 冻结安装及 postinstall/max setup、零警告 lint、类型检查、13 项测试、生产构建全部通过，生成与防污染通过 |
| pnpm verify:templates | 全部 4 模板生成、确定性归档与防污染通过；其它模板本次未重复原生构建 |
| 13 项功能测试 | 分页边界、筛选排序、日期范围、CSV 选择/引号/公式、上传大小/后缀、URL/hash/原型名、JSON fallback；公开配置白名单、脚本字符转义、模式/URL 校验、配置落盘 |
| 11 组生产浏览器检查 | 工作台与项目名；筛选/重置；分页；排序回首页；选择/CSV 下载；图片和文件预览；Excel 空值/非法后缀/注入提交；资料保存；403/404；390px 移动布局；无外部请求或 console/page 错误 |
| 5 组 API/运行时检查 | 直接替换 dist/runtime-config.js 后无需构建即改名/切 api；GET 资料/列表、字典、Blob 导出、success=false 提示、PUT 资料与 admin 权限。浏览器拦截 9 次请求模拟契约响应，未连接真实后端；测试后恢复配置 |
| pnpm dev | 8005 端口启动成功，深链接 /examples/table 返回 200 并展示 48 条数据，runtime-config.js 返回 200，无 pageerror；检查后关闭 |
| 安全与完整性 | 源 83 文件及真实 index 摘要不变；无源 SDK/业务路由/固定加密/私服配置或真实 env；7 个 token 清单覆盖；既有 README 技能说明保留 |

浏览器使用本机 Chromium 与 Playwright，检查桌面与移动截图；生产静态 preview 绑定 localhost。测试脚本、截图及临时依赖不进入模板或 CLI 包。根 CLI 无代码变更，本次未扩展运行其无关测试或重新发布。

## 边界

- Docker daemon 不可连接，Dockerfile/nginx 配置仅为静态部署示例，未声称镜像构建或线上部署通过。Windows、其它浏览器/平台未实测。
- API 检查使用模拟契约，不代表任何实际后端已兼容；上传默认只预览，Excel 示例不解析。前端 access 不代替服务器授权。
- 公共 Umi 依赖树有上游可选 dva / utoopack、Less/PostCSS 相关 peer 提示；模板未启用这些路径，冻结安装、类型检查、dev/build 均通过；不为迁移升级到 React 19 / Ant Design 6。
- 本次不发布模板/catalog/npm；纳入 Git 并走正式模板发布流程后，分发 catalog 才会提供 umi。现有三个模板未改动。

## 用户补充：保留 docker-config

按用户要求移除 .env.example，保留 docker-config/.env.dev、.env.prod；移除原 LOGIN_HOST/公司接口值，改为 APP_NAME、APP_MODE、API_BASE_URL 公开字段。开发配置生成读取 dev，生产构建读取 prod；可选 .env.local 仅本地覆盖、不发布。同步渲染清单、根及生成工程忽略规则、Docker 构建上下文、命令和文档。此次不修改 CLI 环境文件策略，复用其已有 dev/prod 精确白名单。

补充验收通过：四模板描述校验（Umi 59 项）、Umi native verify（冻结安装/类型检查/13 项测试/生产构建及防污染）；仓库外验证 dev/prod 选择、本地覆盖、进程变量优先级和私有字段不导出。7 项渲染清单与 token 一致，临时打包输入包含 dev/prod、不含 .env.example 或 .env.local；源 83 文件及真实 index 摘要不变。Docker daemon 边界同上。

## 用户补充：接入 @charonix/eslint-config

在仓库外安装 @charonix/eslint-config@1.2.0 / eslint@9.39.1 并更新公开锁文件，TypeScript 保持 5.9.3。新增 eslint.config.mjs，启用 React/TypeScript/Tailwind，提供 pnpm lint（零警告）与 lint:fix，verify 在冻结安装后执行 lint。不在模板 files 安装依赖，不修改根依赖或其它模板。

按配置整理导入/格式，给默认数组属性提供稳定常量、命名 Excel hook、移除遗留调试输出及不再必要的 ts-ignore，改用普通 enum；Node 脚本显式导入 process。保留 Node 原生测试，单独关闭 Vitest 的 test/no-import-node-test 导入替换规则；只忽略生成目录、生成的 runtime-config.js 和 Markdown，不关闭其余规则迁就错误。之后以 ESLint 作为此模板源码格式事实源，避免 Prettier 覆盖。

重新通过四模板描述校验（Umi 60 项）、Umi 原生隔离验证（冻结安装、lint、类型检查、13 项测试、build、防污染）；重新运行 11 组生产浏览器检查通过。构建后的再次 lint 通过，确认配置生成不会使 lint 失败。源工程与真实 index 摘要不变，docker-config/.env.dev/.env.prod 保留，未恢复 .env.example。上游 Umi 内置旧 ESLint/TypeScript 插件存在 peer 提示；实际命令使用显式安装的 ESLint 9 和 charon 配置，检查通过。
