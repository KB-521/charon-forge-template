# Vite + NestJS 模板迁移设计

方案索引ID：DES-FE-20261020-002、DES-BE-20261020-002。

## 选择与授权范围

用户要求完成标准模板迁移并明确继续执行，沿用首个模板的通用方向，直接完成可逆的本地实现与验证。备选是保留产品示例（携带业务与资源负担）或仅保留空壳（丢失来源通用能力）；采用保留基础设施与中性联调页的方案。未授权 Git 提交、外发或部署。

## 模板与前端

- `templates/fullstack/vite-nestjs`，id 为 `vite-nestjs`，版本 0.1.0，layout 为 monorepo。
- 根 pnpm workspace 包含 web/server；保留 React 19、Vite 6、NestJS 11 和 TypeScript，统一 Node 22.12+、pnpm 10.18.3。
- 只复制明确白名单源码；`projectName` 渲染根/子包 package.json、README、页面标题、服务标识与 Jenkins 默认模块名；workspace 命令使用目录过滤器，锁文件不依赖项目名。
- 起始页通过通用 fetch 封装读取 `/api/health`，展示加载、失败、重试和成功状态。`/runtime-config.js` 先加载，只公开 API_BASE_URL。
- Vite 开发代理 `/api`、`/check` 和 `/runtime-config.js`，生产由 NestJS 托管 web 构建结果。

## 服务端与配置

- 保留 `/check`、`/api/health` 和 runtime-config 模块；配置脚本明确 JavaScript 类型与 no-store，安全序列化。
- YAML 保留 application/web/oss 分组与 dev/prod 环境文件。`APP_ENV` 优先，兼容 `SPRING_PROFILES_ACTIVE`；只允许 dev/prod，环境变量覆盖 YAML。
- 新增 `OSS_ENABLED=false` 默认值；保留 ali-oss 封装、bucket 白名单与原有 ENC 解密兼容。关闭时不解析必填云凭证，显式使用 OSS 时报告未启用；开启时校验配置，不调用真实云资源完成模板验证。
- 不复制源环境值、密码、加密载荷；示例 YAML 只包含公开默认值，凭证通过进程环境注入。
- 修复默认服务必须有 OSS 参数的问题，并保持配置失败快速报错；不扩展业务 API 或数据库。

## 构建与交付

- build 生成前后端产物并复制 web/dist 到 server/public；start 启动已构建的服务。
- package 通过 pnpm 10 的 `deploy --legacy --prod` 生成独立服务，复制 public 与公开 YAML；运行时依赖不需要原 workspace。
- 保留双 Dockerfile、通用 Jenkins 与部署值示例，统一工具链、移除镜像源绑定、增加 Docker context 排除项。CI Deploy 阶段仅处理外部 manifest 模板，真实部署由使用者接入。
- verify 声明锁定安装、类型检查、build 与 package；额外在临时工程执行服务健康、公开配置、环境覆盖、SPA fallback 与 API 404 检查。Docker 引擎可用时再执行容器构建，否则明确记录。
- 模板验证使用临时 Git index，满足归档 Git 白名单但不暂存用户工作区。生成工程和依赖只写仓库外；结束时校验源项目和模板文件摘要。

## REQ-002 用户确认的复用补充

用户已确认复用盘点并要求迁移，沿用本设计 ID（DES-FE-20261020-002、DES-BE-20261020-002）补充实现，不变更接口协议或加入天气业务。

- 前端保留 linkAbort 的多信号/释放语义；request 增加可配置超时，finally 清理资源，兼容原调用方式。
- 时钟采用 performance.now 计算已校准时间，多个 Hook 共享一个计时器；Intl 格式化允许指定时区。国际化保留默认词条回退/语言持久化，并通知 React 更新，不依赖整页刷新。
- LineChart 从原 TrendChart 提炼，输入为 label/value，不引用气象类型；动态刻度、空/缺失值分段、独立 useId、鼠标/触摸与键盘读取，提示卡避让折线。
- AsyncSearchSelect 从原搜索区域提炼，loadOptions(query, signal) 注入查询；受控 value/onChange、请求防抖、取消、过期响应丢弃、状态提示与 combobox 键盘交互。
- 起始页提供中性示例与中英切换、服务时钟，两个组件保持独立 CSS Module，不引入图表/UI 依赖。
- OSS 补齐 tryGet、exists、tryDownloadToFile、removeMany、delimiter/prefixes/isTruncated 和 Cache-Control；保留 OSS_ENABLED 门禁。文件下载先写同目录临时文件，成功后 rename，失败清理临时文件，目标文件保持完整。批量删除在首个请求前校验全部键。
- 日志从来源 writer/FileLogger/access/error/event 提炼，去除 scheduler/weather-tile 与北京时区绑定；提供 LOG_TO_FILE/LOG_DIR/LOG_RETENTION_DAYS/LOG_TIME_ZONE。访问日志不保存 query，结构化字段与常见凭证文本在控制台/文件均脱敏；容器准备可写日志目录。
- 验证重点为异步取消/竞态、下载清理与批量边界、日志轮转/退出和公开配置隔离；安装构建在临时生成工程，组件交互通过临时浏览器测试，不向模板加入验证工具依赖。
