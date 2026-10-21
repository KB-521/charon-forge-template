# Umi 公共后台模板设计

方案索引ID：DES-FE-20261021-001。

## 选择与范围

用户授权按既有模板模式迁移。原样复制会携带内部 SSO/代理/Logo、业务接口及错误约定；重建空 Umi 工程会丢失有价值的通用表格、上传和工具。选择保留框架和可复用能力，清理公司耦合，用显式可替换的演示服务让开发与生产静态产物均独立运行。

源码 83 文件快照只读。依赖沿用来源主版本（Umi Max 4、React 18、Ant Design 5、Pro Components 2、ahooks 3、Tailwind 3），公开解析后使用精确版本与 pnpm 锁文件；不保留公司 npm registry、SSO SDK、AES 或未使用的隐式依赖。

## 模板协议

位置 templates/web/umi，id umi，category web，layout single，0.1.0，Node 22.12+、pnpm 10.18.3。node/pnpm 安装适配器。projectName 渲染 package、README、默认布局名、docker-config 公开配置和 runtime config；锁文件不包含变动的根包名，不在根 workspace 管理模板。

## 原生应用

保留 Max model/initialState/layout/access/request 与 Tailwind 配置。默认混合后台布局、仪表盘、列表、上传演示、个人资料、403/404；布局使用本地 SVG，不请求外部 Logo。两个数据模式：demo 使用浏览器内的可替换服务数据，不提供真实认证或伪装远端持久化；api 通过同一个服务接口使用公开运行时 API_BASE_URL。权限示例由初始用户权限控制，只演示前端显示，不替代服务器授权。

MetaSheet 延续来源筛选（输入/选择/树/日期/范围）、排序、分页、选择、操作与刷新，纠正 envelope 解包、空数值、页大小变化和列对象污染。行选择与操作 hook 保留；字典及导出移除内部接口。上传组件在验证大小/后缀后调用注入的 upload 函数，默认仅本地预览；回收 object URL；Excel 弹窗移除业务枚举/接口，改为注入提交函数，有等待/错误/空值状态。

移除原用户资料修改/密码、检查系统、云存储签名、权限平台等专用 API。个人资料仅演示本地修改或通过 api 模式明确接入。

## 环境与部署

公开 public/runtime-config.js 在应用 bundle 前加载，包含 APP_NAME、MODE、API_BASE_URL。Node 配置脚本只序列化固定 allowlist，JSON 安全编码；不将整个 dotenv/进程环境注入浏览器。不复用源 env 与占位生产脚本。真实 .env 不进入模板；按用户后续要求删除 .env.example，保留 docker-config/.env.dev 与 .env.prod 作为受控公开配置，开发/构建分别加载。docker-config/.env.local 仅作忽略的本地覆盖，不分发。

开发代理仅在显式 API_PROXY_TARGET 时启用，默认不向任何业务资源发请求。提供 nginx SPA fallback、Docker 多阶段示例与仓库外 preview 脚本，无自动 push/部署。

## 验证

先在仓库外准备工程和锁文件，再将审查后的锁文件同步回模板，使用临时 index 运行实际生成和 native verify。类型检查覆盖来源组件；有效测试覆盖列表分页/排序、上传校验、CSV 导出与 runtime allowlist。浏览器在构建产物上验证导航、权限、列表、上传、Excel、资料及运行时配置，不依赖开发 mock。记录所有外部验收边界，比较来源 83 文件和真实 index 摘要。保留已有 README / 技能修改，不提交或发布。

## 代码规范补充

按用户要求接入 @charonix/eslint-config 1.2.0，React/TypeScript/Tailwind 开启，Node 原生测试保留，生成文件排除；lint 要求零警告并加入 verify，源码格式由 ESLint 维护。TypeScript 保持 5.9.3。
