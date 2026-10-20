---
name: req-impl
description: 后端业务执行层实现。用于按已确认的需求和契约实现 Service/ServiceImpl、Facade、状态机、事务、幂等、补偿、定时任务、MQ 消费、事件处理和外部能力编排；不承接持久化 DAO/Mapper 或 HTTP Endpoint/Controller 入口实现。
version: 2.0.0
owners:
  - sunwencong
---

# 后端业务实现

## 目标

按目标项目既有分层和规则实现业务执行闭环，把业务规则、事务、状态、幂等、补偿和外部能力编排收口到 Service/Facade 或等价业务组件。

## 命中场景

- Service、ServiceImpl、Facade、Domain Service、状态机、业务校验、事务、幂等、补偿、异常和日志实现。
- 定时任务、MQ consumer/listener、事件 handler/subscriber、异步任务和补偿任务的业务执行入口。
- 外部 SDK、Client、Facade、Adapter、计费、资产、回调后处理等业务编排。
- 已有持久化能力和已确认 service 契约上的业务逻辑补齐。

## 不适用场景

- DDL、DML、schema delta、history compat、rollback/fixforward SQL 文件，改用 `server/persistence-impl`。
- DAO、Mapper XML、Manager、PO/POQuery、generator、OpenDAO/OpenMapper 等 Java 持久化骨架，改用 `server/skeleton-codegen`。
- Endpoint/Controller、DTO/VO、路由、请求响应、参数校验和响应封装，改用 `server/entry-impl`。
- 逻辑模型、物理 SQL、字典/枚举、兼容 SQL 设计时，改用 `server/data-model-design`。
- 后端技术方案或 API 契约冻结时，改用 `server/backend-design`。
- 用户明确要求生成 Java 测试代码时，调用 `server/test-codegen`。
- 用户明确要求 code review 时，作为独立任务调用 `server/code-review`。

## 输入

- PRD、任务卡、用户补充约束或 API 契约。
- 目标项目 `AGENTS.md` 或等价项目说明。
- `references/rules/INDEX.md` 与按“规则索引”命中的本地规则正文。
- 目标模块、service/facade 方法、业务动作、错误语义、权限边界、事务和幂等要求。
- 需要调用的持久化方法契约表；缺少 Java 持久化骨架时转 `server/skeleton-codegen`，缺少 SQL 文件时转 `server/persistence-impl`。
- 若由 HTTP 入口触发，需有 `server/entry-impl` 或 API 契约给出的入口字段语义。
- 若由定时任务、MQ、事件或异步任务触发，需明确触发源、消息/参数、幂等键、锁粒度、重试、ack/nack、补偿和调用 service。
- 需要复用的相似实现、源码下钻证据和验证方式。
- 涉及外部能力时，需要已确认的 SDK、Client、Facade、Adapter、YApi、接口文档或调用样例。

## 执行模式

- Fast Path：单 service 方法、单业务分支或单 worker 入口小改；影响面清楚；依赖已确认；不涉及 schema、外部能力、复杂状态机、兼容发布或多文件跨层改动。
- Full Path：涉及外部能力、计费、租户权限、状态流转、worker 入口、持久化调用缺口、兼容影响、多个文件，或 Fast Path 任一条件不满足。
- 超出本 skill：SQL 文件转 `persistence-impl`；Java 持久化骨架转 `skeleton-codegen`；HTTP 入口转 `entry-impl`；数据模型/SQL 设计转 `data-model-design`；测试代码专项转 `test-codegen`；review 转 `code-review`。

## 执行顺序

```text
需求输入
  -> 选择 Fast Path 或 Full Path
  -> 按 step-runbook 执行对应路径
  -> 输出步骤摘要、命中规则、验证和风险
```

执行前读取 [references/step-runbook.md](references/step-runbook.md) 和 [references/rules/INDEX.md](references/rules/INDEX.md)。runbook 只给候选规则范围，实际仍按任务事实匹配 `references/rules/INDEX.md` 中的规则索引，只下钻命中的本地规则正文。无法确认使用 Fast Path 时，默认 Full Path。

## 实现原则

- 每一步先产出当前步骤的事实、缺口和不做项，再改代码。
- 只读取与当前产物、动作、风险匹配的规则子类，避免批量加载规则正文。
- 目标项目源码、相似实现和已确认契约优先；禁止猜包名、类名、SDK、方法、字段或配置。
- 只做当前需求最小业务闭环，不顺手增加抽象、扩展点或无关重构。
- Job/Consumer/EventHandler 只做触发、解析、锁、ack/nack、重试策略和调用 service；复杂业务规则必须下沉到 Service/Facade。
- Service 不直接拼复杂 SQL；缺 SQL 文件时转 `server/persistence-impl`，缺 Java 持久化骨架时转 `server/skeleton-codegen`。
- 复杂或高风险业务必须输出业务契约：能力、Service/Facade 方法、入参语义、返回语义、事务边界、幂等键、状态流转和异常/错误码；命中 Job/MQ/Event/Async 时同时输出 Worker/MQ/Event 契约：入口类型、触发源、消息/参数、幂等键、锁粒度、重试策略、ack/nack、补偿/告警和调用 Service。
- 默认不自动调用 `server/test-codegen` 或 `server/code-review`。

## 交付

输出时必须给出：
- 步骤执行摘要。
- 命中规则和未命中原因。
- 业务逻辑与字段规则对照。
- Service/Facade 业务契约；命中异步入口时包含 Worker/MQ/Event 契约。
- 实现文件列表。
- 对外入口契约影响；需要 HTTP 入口改动时转 `server/entry-impl` 或说明入口层待办。
- 数据、枚举与兼容影响。
- 验证结果或未验证原因。
- 剩余风险。

## Gate

- Gate 0：未读取 `step-runbook.md` 并选择执行模式，禁止开始编码。
- Gate 1：未确认业务契约、代码落点、持久化方法和相似实现证据，禁止改文件。
- Gate 2：外部能力未确认 SDK、Client、Facade、Adapter、YApi、接口文档或调用样例时，禁止猜测实现。
- Gate 3：命中持久化、HTTP 入口、数据模型设计、测试专项或 code review 时，转对应 skill，禁止继续用本 skill 硬做。
- Gate 4：未完成命中规则自检和最小验证说明，禁止交付。
- Gate 5：最终交付必须包含步骤摘要、命中规则、实现文件、契约影响、数据影响、验证结果和剩余风险。

## 按需提示词

需要把用户输入整理成实现指令时，可读取 [references/implementation-prompt.md](references/implementation-prompt.md)。提示词只用于整理输入，不替代目标项目源码和规则正文。
