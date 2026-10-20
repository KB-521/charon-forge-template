---
name: backend-design
description: 需求评审后、后端编码前使用；将 PRD、任务和变更输入冻结为后端技术方案、字段级 API 契约、数据模型引用与实现边界。具体数据建模、DDL、字典和兼容 SQL 由 server/data-model-design 承接。
version: 1.12.0
owners:
  - sunwencong
---

# 后端技术方案

将需求转成可评审、可实现、可追溯的后端设计资产，重点解决“领域边界是什么、接口怎么定、数据影响在哪里、存量如何兼容”。

## 何时使用

- 需求已明确，需要在后端开发前冻结 API、模块边界、数据影响或兼容口径。
- 涉及新增/调整 API、状态机、外部系统集成、权限、幂等、事务或数据模型引用。
- 直接开工会导致接口遗漏、模型漂移或旧链路兼容风险。

## 小变更模式

单接口、单字段或局部行为调整，且不新增复杂状态、外部集成或跨模块兼容口径时，可使用小变更模式。

最小输出必须包含：
- 变更摘要：说明本次调整的业务动作和影响入口。
- API 影响：列出新增/修改/不变的接口、字段、错误码或兼容口径。
- 数据影响：引用 `server/data-model-design` 结论；无表结构或字典影响时明确写“无数据模型影响”。
- 实现边界：列出需要修改的模块、类、方法或配置入口。
- 风险与待办：记录兼容、回滚、联调、测试或待确认项。

若涉及新增表、状态机、权限矩阵、事务边界、外部依赖、批量兼容 SQL 或多端契约，必须切回完整设计模板。

## 外部能力发现

涉及用户、租户、组织、权限、账户、余额、扣费、退款、审计、通知或其它外部能力时，必须先发现真实接入点，再冻结方案。

发现顺序：
- 抽象能力：先把需求中的业务词归类为用户、租户、账户、计费、文件、通知等能力。
- 查依赖入口：优先搜索 `pom.xml`、构建文件、配置入口和已有模块依赖。
- 查现有调用：用 `rg` 搜 `Client`、`Facade`、`Adapter`、`Service`、`SDK`、能力关键词和相似业务链路。
- 查契约来源：按需查询 YApi、SDK 公开方法、接口文档或现有客户端 DTO。
- 小范围读取：只读取命中的接口定义、调用点、DTO、配置和测试样例，不批量加载无关源码。

找不到真实接入点时，输出 BLOCKER 或待确认项：缺少的能力、已搜索范围、候选为空的原因、需要用户提供的 SDK 名、接口文档、YApi、调用样例或是否新增适配层的确认。禁止猜测 SDK、包名、方法名、字段或配置。

## 工作流

1. **分析输入**
- 输入：PRD、任务、评审结论、用户补充约束、已有设计结论。
- 先确认 `change-id`、项目域、设计包、变更类型和 BLOCKER。
- 从 PRD/任务中抽取动作，建立“功能点 -> 动作 -> API”基线。
- 同步抽取任务事实：产物、动作、风险、缺口和不做项，用于匹配规则命中条件。
- 判断使用小变更模式或完整设计模板；无法确认时默认完整设计模板。

2. **调研现有实现**
- 读取根目录和 `server/AGENTS.md`，确认模块职责和入口。
- 读取 `references/rules/INDEX.md`，按“规则索引”只下钻命中的本地规则文件。
- 用 `rg` 精确查源码、SQL、枚举、YApi/接口客户端和既有设计，不批量加载大文档。
- 命中外部能力时，按“外部能力发现”流程定位真实 SDK、Client、Facade、Adapter 或接口契约。

3. **方案设计**
- 识别数据影响；涉及逻辑模型、表结构、字典或兼容 SQL 时，调用或引用 `server/data-model-design` 产物。
- 合并 API 来源：用户指定、当前 `change-id` 的 tasks、既有设计、PRD。
- 明确权限、幂等、事务、状态机、外部依赖、降级和补偿策略。
- 外部主数据、认证、组织、用户、租户来源必须明确；需要接口、方法或字段时通过 SDK、源码、YApi 或现有客户端实时查询，不在 skill 中维护静态快照。

4. **文档产出**
- 按 `references/template.md` 产出主设计。
- 需要字段级 API 契约、覆盖追溯或 Go/No-Go 判定时读 `references/api-contract-template.md`。
- 需要把 PRD、数据模型、持久化、业务、入口、测试和 YApi 串成执行闭环时，在主设计中补齐 `功能点 -> 数据模型 -> 持久化能力 -> Service/Facade -> Worker/MQ/Event -> HTTP Entry -> 测试 -> YApi` 实现层矩阵。
- 涉及数据模型或 SQL 时，引用 `server/data-model-design` 的产物和结论，不在本 skill 维护建表细则。
- 同步维护根 `design/INDEX.md`；若使用 `design/<design-package>/`，同步维护子目录 `INDEX.md`。
- 新增设计索引 ID 时按“并行防冲突 ID”生成，不使用纯当日递增序号抢占全局唯一性。

5. **评审与门禁**
- 自检时读 `references/checklist.md`。
- 未处理 BLOCKER、核心待确认项未确认或追溯不完整时，只能输出“评审版”。
- 规则冲突时，以本 skill `references/rules/` 命中的规则文件为准。

## 输出

- 主文档：`ai-workflow/sdd/changes/<change-id>/design/<design-package>/<project>-backend-design.md`，单一小变更可落在 `design/<project>-backend-design.md`。
- 数据模型引用：引用 `server/data-model-design` 产出的逻辑模型、物理 SQL、delta、history compat 和字典/枚举方案；范围小可在主文档保留摘要。
- API 契约：`<project>-api-contract.md`，需要字段级接口契约时产出。
- 实现层映射：复杂需求必须在主设计中给出 `功能点 -> 数据模型 -> 持久化能力 -> Service/Facade -> Worker/MQ/Event -> HTTP Entry -> 测试 -> YApi` 的交接矩阵；小变更可说明不涉及项。

## 规则

- 详细方案规则、门禁、交付要求和反例统一在 `references/rules/INDEX.md` 中按规则索引读取。
- 本文件只保留工作流、输入输出和关键路由；若与本地规则包冲突，以 `references/rules/` 命中的规则文件为准。

## 并行防冲突 ID

- 新增设计索引 ID 禁止只用 `DES-BE-<YYYYMMDD>-<XXX>` 这类当日递增序号作为唯一来源。
- 推荐格式：`DES-BE-<YYYYMMDDHHmmss>-<change-or-package>`。
- `<change-or-package>` 优先使用当前 `change-id`、设计包 slug 或任务短标识，只保留小写字母、数字和中划线。
- 设计文档、SQL 文件和任务文档之间的执行顺序、依赖顺序写入 `INDEX.md`、任务文档或 release runbook；不要依赖 ID 或文件名前缀序号表达顺序。
- 既有 `DES-BE-<YYYYMMDD>-<XXX>` ID 保持不强制重命名；后续新增 ID 按本规则执行。
