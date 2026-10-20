# Server Skills 链路

本索引用于选择后端任务所需 skill，只做导航，不替代各 skill 的 `SKILL.md`。

## 推荐链路

| 阶段 | 使用 skill | 触发条件 | 主要产出 |
| --- | --- | --- | --- |
| 需求到后端方案 | `server/backend-design` | 后端编码前需要冻结 API、模块边界、数据影响或实现边界。 | 后端技术方案、API 契约、数据模型引用。 |
| 数据模型设计 | `server/data-model-design` | 涉及表结构、字段、索引、字典、枚举或存量兼容口径。 | 逻辑模型、物理 SQL、SQL 契约、兼容口径。 |
| SQL 文件实现 | `server/persistence-impl` | 数据模型和 SQL 目录规则已冻结，需要生成 DDL、DML、兼容回填、回滚/补救或 manifest。 | SQL 文件、执行顺序、幂等、影响范围、回滚/补救、manifest。 |
| 骨架代码生成 | `server/skeleton-codegen` | SQL 文件已确认，需要生成或补齐 Java 持久化代码骨架。 | generator、PO/POQuery、DAO/Repository、Mapper XML、sqlmapplus/OpenDAO、薄 Manager/Repository wrapper。 |
| 业务执行实现 | `server/req-impl` | 已有持久化能力或模块上需要实现 Service、Facade、定时任务、MQ、事件或外部能力编排。 | 业务代码、事务/幂等/补偿、自检、验证说明与剩余风险。 |
| 支付 starter 实现 | `server/pay-starter-impl` | 新增或校验 my-archetype 第三方支付渠道 starter，并接入 measure 支付、订阅、退款、提现链路。 | starter 与 measure 职责边界、开发主链、合规 findings、源码参考和测试矩阵。 |
| 对外接口实现 | `server/entry-impl` | 业务 service 已确认，需要新增或修改 Endpoint/Controller、DTO/VO、路由和响应封装。 | HTTP 入口、DTO/VO、字段级契约、YApi 同步建议；优先 Endpoint。 |
| 测试代码 | `server/test-codegen` | 需要补 Java unit 或 api-mock 测试代码。 | 测试代码、覆盖场景、执行命令。 |
| 代码评审 | `server/code-review` | 用户明确要求 review 或 PR/CI 需要后端评审。 | 按严重级别排序的问题、风险和修复建议。 |
| 接口文档同步 | `server/yapi-mcp-sync` | Endpoint 开发完成后需要同步或补齐 YApi。 | 字段级 YApi 接口文档与 upsert 结果；当前仅自动处理 `**Endpoint`。 |

## 规则入口

- 后端 skill 涉及稳定规则时默认读取自身 `references/rules/INDEX.md`，再按其中“规则索引”命中本 skill 的规则切片。
- 新项目或无历史参考时，目标项目已有明确约定的以源码、AGENTS 和构建文件为准；没有明确约定的由命中的 skill 读取自身默认生成规范。
- 专项工作流 skill 可以同时保留主链 reference 和规则切片；例如 `server/pay-starter-impl` 用 `mainline-*` 串开发步骤，用 `references/rules/` 承接 starter 与 measure 边界规则。
- 公共门禁已内联到各 skill 自己的不可跳过规则中；不要新增共享 rules 入口。
- `ai-workflow/wiki/server/rules/` 是冻结兼容区，仅用于迁移追溯，不作为默认执行入口。
- `common/init-rules` 不再向 `wiki/server/rules` 发布 server 主规则；后续规则修改落到对应功能 skill 的 `references/rules/`。

## 通用执行约定

- 目标代码库源码、相似实现、API 契约、YApi、SDK 公开签名和当前 skill 规则正文优先于模板示例。
- 外部能力必须从真实来源确认；找不到 SDK、Client、Facade、Adapter、YApi、接口文档或调用样例时，输出缺口或 BLOCKER，禁止猜测。
- 默认不串联调用测试、code review 或 YApi 同步；只有用户明确要求或当前 skill 明确命中时才切换。
- references 中的示例只能作为占位格式，禁止迁移其中的包名、类名、路径、路由、配置或业务事实。
- 跨层交付需要结构化表格时，由当前 skill 在本地交付要求中输出对应契约表，不再依赖共享 handoff 文件。

## 后端实现分层

- `persistence-impl`：只负责 SQL 文件，包括 DDL、DML、history compat、rollback/fixforward 和 manifest。
- `skeleton-codegen`：只负责 Java 持久化代码骨架，包括 generator、PO/POQuery、DAO/Repository、Mapper XML、sqlmapplus/OpenDAO 与薄 Manager/Repository wrapper。
- `req-impl`：负责 Service/Facade/Job/MQ/EventHandler 等业务执行层；worker 入口只做触发、解析、锁、ack/nack、重试、补偿和调用 service。
- `entry-impl`：负责 HTTP Endpoint/Controller、DTO/VO、参数校验、响应封装和 API 契约对齐；新入口优先使用 Endpoint，历史 Controller 需说明 YApi 自动同步缺口。
- 发现跨层缺口时，停止当前 skill 并转对应层，不在一个 skill 内硬做全链。

## Skill 分组

- 通用 skill：backend-design、data-model-design、persistence-impl、skeleton-codegen、req-impl、entry-impl、test-codegen、code-review、yapi-mcp-sync。
- 专项 skill：pay-starter-impl，绑定 my-archetype / measure 支付 starter 体系，不作为新项目通用后端链路默认步骤。
- 兼容入口：init-business，只转发到 common/init-business 后端规则。
