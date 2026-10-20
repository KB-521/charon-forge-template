# REQ-002 通用能力迁移与验证

用户已确认上一轮复用建议并要求迁移；本次在原模板设计（DES-FE-20261020-002、DES-BE-20261020-002）上补充，不修改原项目。

## 交付范围

- `web/src/components/LineChart/`：从 TrendChart 提炼的独立 SVG 折线图，动态刻度、缺失点断线、单点、独立 ID、提示卡避让、键盘与触摸读数。
- `web/src/components/AsyncSearchSelect/`：注入 loader 的异步搜索选择器，防抖、取消/旧响应丢弃、加载/错误/空状态、清空、键盘和触摸选择。
- `web/src/lib/abort.ts`、request：多信号取消、首个取消原因传递、监听器释放、默认 15 秒超时、HttpError/204 处理。
- server-clock/display-time：共享计时器、单调时间、最后订阅者退出清理、可配置 Intl 时区，不再绑定天气接口或北京时间。
- `web/src/lib/i18n/`：沿用首个模板的语言持久化与中文/原 key 回退，增加 React 订阅式更新与存储不可用容错。
- `server/src/oss/oss.service.ts`：补齐 tryGet、exists、原子流式下载、批量删除、目录列举与 Cache-Control，继续默认关闭 OSS、保留 bucket 白名单。
- `server/src/logging/`：应用/错误/访问日志、日目录与保留期、退出刷新、控制台/文件共同脱敏；去除气象流与固定时区。
- 起始页接入中性示例、中英切换和服务时钟；新增 [组件 API 文档](../../../../templates/fullstack/vite-nestjs/files/docs/reusable.md)，同步模板 README/CHANGELOG。
- 沿用原有依赖，根/两子包 manifest（除生成时项目名外）及 pnpm-lock.yaml 与初次迁移版本一致。版本保持尚未发行的 0.1.0。

## 验证环境与边界

macOS，Node v22.23.2、pnpm 10.18.3。浏览器使用本机 Google Chrome，由临时目录中的 Playwright 1.56.1 驱动；验证工具与 fixture 未加入模板依赖或发布内容。

最终执行 `pnpm templates:validate`、`pnpm verify:templates --template vite-nestjs --native` 均通过；原生验证包含锁定安装、两端类型检查、build/package 及重复生成/摘要防污染。

使用临时 Git index，实际发布清单为 62 个工程文件 + template.json 共 63 个条目。原项目 web/src、packages/weather-core/src、server/src 共 130 个文件的 SHA-256 和 Git 状态与本轮开始一致；真实 Git index SHA-256 未变。

检查发现模板 files 下已有本轮开始前建立的 node_modules（15:34），并有用户原先启动的 dev:all 进程；本轮工作目录建立于 15:46。未删除、停止或纳入发布这些已有内容。新增日志模块可能随现有 watch 进程重启产生忽略目录中的日志；本轮没有在 files 下执行安装、构建或启动命令。归档按 Git 白名单排除了依赖、构建结果、日志、测试 fixture 和本地环境文件。

## 后端行为检查：12 项通过

临时脚本使用真实构建产物和 SDK mock，不连接实际 OSS：

1. tryGet/exists 区分不存在与网络/权限失败。
2. 流式下载成功后才替换已有目标。
3. 不存在或中途失败时保留已有目标、清理临时文件。
4. 取消流式下载时清理临时文件。
5. 批量删除先验证全部键，1105 个对象按 1000/105 拆批。
6. 空前缀、目录分隔符、分页结果、最大条数和 Cache-Control。
7. OSS 关闭与非法 bucket 不触达 SDK。
8. 并发提交的日志保持顺序、清理旧日期，保留普通目录与符号链接。
9. 文件日志关闭时不创建目录。
10. 结构化字段、凭证文本、私有环境占位值和换行的处理。
11. 错误 cause 保留传输码；事件字段脱敏。
12. Nest 控制台输出同样经过脱敏。

## 浏览器与运行检查：10 组通过

独立 package 被复制到 workspace 外的服务目录，再启动 NestJS；Vite 验证使用临时端口与对应的代理目标。fixture 只写临时生成工程。

1. 独立服务启动、生产静态页、API 404、公开配置类型/no-store/私有值隔离。
2. 首页选择/清空/空结果、键盘交互、语言切换与刷新后持久化。
3. 请求超时/取消、释放后的信号隔离、HttpError、缺词与原 key 回退、UTC/上海时区显示。缺词场景通过临时英文词典 fixture 验证，结束后恢复。
4. 375px 宽布局无横向溢出。
5. loader 忽略 signal 时旧响应仍被丢弃；清空不回填；错误/空状态与 ArrowUp/Enter 选择。
6. 图表缺失点分段、空/单点、动态刻度、多实例渐变 ID 与键盘读数。
7. 两个消费者共享一个时钟计时器；修改 Date.now 不导致跳变；最后卸载时释放计时器。
8. 生产构建中的手机触摸选择和图表选点，完成视觉截图检查。
9. localStorage 读写抛错时仍能初始化和即时切换语言。
10. 关闭服务前日志刷新完成，访问日志不含 query 或注入的私有占位值。

浏览器回归发现并修正：触摸选择后图表焦点不再重置到第一点，触摸抬手后保留选中读数。最终回归无 pageerror，全部验证子进程已退出；用户原有开发进程保留。

## 记录与限制

- 原生验证、后端检查和浏览器验证均在仓库外完成；临时结果位于 `/var/folders/vn/30r7xyc53hn9mxbl63b50j780000gp/T/forge-reuse-l60oi_xq/`，包含 native-verify.log、browser-results.json、mobile.png；这些临时证据不承诺长期保留。
- Docker daemon 仍不可连接，因此未验证镜像构建和容器内权限；Dockerfile 已准备非 root 用户可写日志目录。实际 Jenkins/集群与真实云资源未调用。
- 本轮未更改 ENC 算法，未扩展业务 API、数据库、GIS 或天气模块；未新增模板测试工具依赖。相关验证脚本为临时行为检查，不表示模板自带完整自动化测试套件。
- Agent：implementation-executor。Skill：req-dev、frontend-design、security-auditor；沿用已有迁移设计与 writing-plans 计划，串行实施。
- 未暂存到真实 Git index、提交或发布。
