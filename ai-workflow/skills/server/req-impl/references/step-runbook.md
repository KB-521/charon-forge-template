# Req Impl Step Runbook

本 runbook 用于后端业务执行层实现。每一步的“规则范围”是候选范围，不是固定矩阵；实际执行时仍按任务事实匹配 `references/rules/INDEX.md` 中的规则索引，只读取命中的本地规则正文。

## 模式选择

| 模式 | 使用条件 | 步骤 |
| --- | --- | --- |
| Fast Path | 单 service 方法、单业务分支或单 worker 入口小改；影响面清楚；依赖已确认；不涉及 schema、外部能力、复杂状态机、兼容发布或多文件跨层改动 | F0-F3 |
| Full Path | 涉及外部能力、计费、租户权限、状态流转、worker 入口、持久化调用缺口、兼容影响、多个文件，或 Fast Path 任一条件不满足 | Step 0-6 |

无法确认是否满足 Fast Path 时，默认使用 Full Path。

## Fast Path

### F0. 定界

目标：确认输入、落点、规则命中和不做项。

规则范围：业务边界、分层落点、命名模型、交付门禁。

产出：
- 任务事实、Service/Facade/worker 方法落点、相似实现证据。
- 不做项和是否保持 Fast Path 的结论。

门禁：
- 发现外部能力、schema、复杂状态、持久化能力缺口、HTTP 入口、兼容发布或跨多文件改动时，切换 Full Path 或转对应 skill。

### F1. 实现

目标：按既有分层完成最小业务闭环。

规则范围：按实际产物匹配业务校验、事务一致性、持久化调用、日志注释、配置枚举、异步幂等。

产出：
- 最小代码改动。
- 业务校验、业务逻辑、返回语义、worker 触发语义和必要日志。

门禁：
- 不新增无关抽象，不扩大范围。
- 任何未确认 SDK、配置、码值、权限或持久化方法，切换 Full Path 或输出缺口。

### F2. 影响

目标：确认业务契约、数据、枚举、外部能力、入口层和兼容影响是否仍为小改。

规则范围：业务契约、校验错误、持久化调用、配置枚举、交付门禁。

产出：
- 业务契约/数据/枚举/入口层/兼容影响结论。
- 是否需要切换 Full Path 或其它 skill。

门禁：
- 影响 schema、兼容 SQL、HTTP 入口、外部能力或旧链路时，停止 Fast Path。

### F3. 交付

目标：完成最小验证、规则自检和交付说明。

规则范围：`logging-comment.md`、`delivery-gates.md`，以及前面已命中的规则检查清单。

产出：
- 步骤摘要、命中规则、实现文件、验证结果或未验证原因、剩余风险。

门禁：
- 没有验证说明或风险说明，禁止交付。

## Full Path

### Step 0. 输入与边界冻结

目标：判断本任务是否由 `req-impl` 业务执行层承接，冻结需求输入、缺口和不做项。

规则范围：`service-boundary.md`、`delivery-gates.md`。

产出：
- 任务事实：产物、动作、风险、缺口、不做项。
- 输入来源：PRD、任务卡、API 契约、用户补充或源码证据。
- 路由结论：继续 `req-impl`，或转 `backend-design`、`data-model-design`、`persistence-impl`、`skeleton-codegen`、`entry-impl`、`test-codegen`、`code-review`。

门禁：
- 命中持久化能力、HTTP 入口、数据模型设计、测试专项或 code review 时，停止本 skill。
- 业务契约、目标模块或关键业务口径缺失时，先输出缺口清单。

### Step 1. 动作与业务规则抽取

目标：把输入拆成动作级业务逻辑、状态/错误语义、事务边界、worker 触发方式和入口影响。

规则范围：命名模型、业务契约、校验错误、配置枚举。

产出：
- 动作清单：查询、创建、更新、删除、状态流转、外部调用等。
- 业务规则：权限、状态、幂等、事务、补偿、外部能力、worker 触发和边界行为。
- 状态/类型码值、错误码、配置/枚举来源。
- Service/Facade 业务契约草案；命中 Job/MQ/Event/Async 时补 Worker/MQ/Event 契约草案。

门禁：
- 码值、错误码、权限边界、持久化方法或入口契约不明时，标记缺口，不猜测。
- 需要新增/修改 DTO、VO、Endpoint 或 Controller 时，转 `entry-impl`。

### Step 2. 落点与相似实现定位

目标：确认目标模块、业务层落点、计划修改文件和相似实现证据。

规则范围：架构模块、命名模型、Service 事务一致性、持久化调用边界。

产出：
- 目标模块、Service/Facade/Job/Consumer/EventHandler、方法和配置入口。
- 相似实现证据和复用方式。
- 计划修改文件与不修改文件。

门禁：
- 找不到落点或相似实现时，先输出缺口清单，不猜包名、类名或方法名。
- 发现需要新增表、改字段或 HTTP 入口时，转 `data-model-design`、`persistence-impl` 或 `entry-impl`；发现缺 DAO/Mapper/Manager/OpenDAO 时，转 `skeleton-codegen`。

### Step 3. 外部能力与上下文确认

目标：确认用户、租户、权限、计费、SDK、Client、Facade、Adapter、open 链路和上下文依赖。

规则范围：`tenant-open-access.md`、`logging-comment.md`、`worker-async-idempotency.md`、`external-integration.md`。

产出：
- 外部能力真实接入点和来源证据：SDK、Client、Facade、Adapter、YApi、接口文档或调用样例。
- 调用边界、超时、重试、降级、补偿和幂等策略。
- 用户/租户/组织/open 上下文传递和清理方式。
- Job/MQ/Event/Async 的触发源、消息/参数、幂等键、锁粒度、重试策略、ack/nack、补偿和告警。

门禁：
- 外部能力未确认真实接入点时，禁止实现。
- 涉及计费、资产、回调或公开写入口时，必须明确幂等和补偿。

### Step 4. 实现业务闭环

目标：按目标项目分层落代码，完成当前需求的最小业务闭环。

规则范围：按实际产物匹配：
- HTTP 入口/DTO/VO：转 `entry-impl`。
- Service/事务/状态：`service-boundary.md`、`transaction-consistency.md`、`worker-async-idempotency.md`。
- 持久化能力：调用 `skeleton-codegen` 已确认的 Java 方法契约；缺 SQL/schema/兼容数据时转 `persistence-impl`，缺 DAO/Mapper/Manager/OpenDAO 时转 `skeleton-codegen`。
- 配置/枚举：`validation-error-state.md`。
- 日志/注释：`logging-comment.md`。

产出：
- Service/Facade/Job/Consumer/EventHandler 或目标项目等价业务组件改动。
- 业务成功、失败、边界、异常和返回语义。
- Business Service Contract；命中异步入口时包含 Worker/MQ/Event Contract。
- 日志、注释、配置、枚举和持久化调用的必要联动。

门禁：
- HTTP 入口层改动转 `entry-impl`；本 skill 不修改 Endpoint/Controller/DTO/VO。
- 不在业务层拼复杂 SQL；缺 SQL/schema/兼容数据时转 `persistence-impl`，缺 Java 持久化骨架时转 `skeleton-codegen`。
- 不做无关重构、无关抽象或范围外扩展。

### Step 5. 影响面与兼容处理

目标：确认业务契约、数据、枚举、入口层、旧链路、租户、权限、发布和回滚风险。

规则范围：业务契约、校验错误、持久化调用、上下文租户、配置枚举、交付门禁。

产出：
- 业务契约和入口层影响：新增、修改、不兼容或不涉及。
- 数据、枚举、配置、持久化、历史兼容和回滚影响。
- 旧接口、旧数据、旧任务、旧消息和旧调用方影响。

门禁：
- 涉及 schema、字典、枚举、兼容 SQL 时，转 `data-model-design` / `persistence-impl` 或引用其产物；涉及 DAO/Mapper/Manager/OpenDAO 时，转 `skeleton-codegen` 或引用其产物。
- 影响旧链路但缺少兼容策略时，禁止交付定稿结论。

### Step 6. 自检、验证与交付

目标：按命中规则完成自检、最小验证和交付说明。

规则范围：`logging-comment.md`、`delivery-gates.md`，以及前面各步骤已命中的规则检查清单。

产出：
- 步骤执行摘要。
- 命中规则和未命中原因。
- 业务逻辑与字段规则对照。
- 实现文件列表。
- 业务契约和入口层影响。
- 数据、枚举与兼容影响。
- 验证结果或未验证原因。
- 剩余风险。

门禁：
- 没有验证结果或未验证原因，禁止交付。
- 没有命中规则自检和剩余风险说明，禁止交付。
- 默认不自动调用 `server/test-codegen` 或 `server/code-review`。
