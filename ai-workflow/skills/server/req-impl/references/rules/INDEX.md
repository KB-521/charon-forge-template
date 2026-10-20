# Req Impl Rules

业务实现只加载本目录规则。

## 读取规则

- 先抽取业务产物、动作、风险和缺口，再按“规则索引”只读取命中的本地规则文件。
- 规则冲突时，以当前 skill 本地规则和当前 SDD/API 契约为准。

## 规则索引

| 任务事实 | 读取规则 | 可跳过条件 |
| --- | --- | --- |
| Service、Facade、Domain Service、业务编排、规则收口、分层落点 | `service-boundary.md` | 不涉及业务层实现 |
| 多表写、事务、状态流转、补偿、远程协同、资产/计费一致性 | `transaction-consistency.md` | 纯只读且无副作用 |
| 租户、组织、用户上下文、open、跨租户、全局扫描、调度扫描、线程上下文 | `tenant-open-access.md` | 不涉及用户、租户、组织、open 或公开链路 |
| 定时任务、MQ、事件、异步、锁、幂等、ack/nack、重试、补偿任务 | `worker-async-idempotency.md` | 同步链路且无并发、重试或异步触发 |
| SDK、Client、Facade、Adapter、三方 HTTP/gRPC、文件、计费、导入导出 | `external-integration.md` | 不涉及外部系统或文件/计费能力 |
| 字段规则、业务校验、错误码、异常、状态机、枚举码值 | `validation-error-state.md` | 不新增或修改校验、错误、异常、状态或枚举 |
| 日志、注释、TODO、交付说明 | `logging-comment.md` | 纯机械改动且无业务语义 |
| 验证、交付、剩余风险 | `delivery-gates.md` | 不可跳过 |
