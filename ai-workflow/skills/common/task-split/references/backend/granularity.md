# 后端粒度与任务类型

## 复杂度评分

从 0 分开始累加：

| 事实 | 分值 |
| --- | --- |
| 1~2 个 API 或 1 条简单读/写链路 | +1 |
| 3~5 个 API 或多条同类读写链路 | +2 |
| 表结构、SQL、数据兼容或回填 | +2 |
| 状态机、事务边界、幂等、并发控制 | +2 |
| 异步、事件、MQ、定时任务、补偿 | +2 |
| 外部 SDK/Client、支付/计费/第三方系统 | +2 |
| 多模块、多端契约或跨服务协同 | +2 |
| 迁移、灰度、回滚、发布顺序风险 | +2 |
| 单字段、单校验、纯展示或纯配置小改 | -1 |

## 拆分预算

| Level | 场景 | Split Budget | 文档深度 |
| --- | --- | --- | --- |
| XS | 单字段、单校验、微小 API 调整 | 1 | 轻量父计划或 1 个子任务 |
| S | 单条简单读写链路，少量 DAO/Service/Entry 修改 | 1~2 | 标准子任务，允许合并相邻层 |
| M | 表结构 + 业务链路 + 接口，影响清晰 | 2~4 | 标准父计划 + 子任务 |
| L | 多 API、多状态、异步、外部依赖、迁移或并行协作 | 4~6，默认最多 8 | 完整父计划、DAG、并行队列 |
| XL | 超过 8 个合理子任务，或跨多个业务域/阶段 | 拆成多个父需求或阶段 | 不在一个父计划硬塞 |

## 子任务复杂度预算

父计划用 `Split Budget` 控制总任务数；单个子任务用 `Subtask Complexity Budget` 防止复杂能力混包。

每个子任务按复杂驱动计分：

| 复杂驱动 | 分值 |
| --- | --- |
| 表结构 / 兼容 SQL / 回填 | +1 |
| 状态机 / 事务 / 幂等 / 并发控制 | +1 |
| 异步 / MQ / 事件 / 定时 / 补偿 | +1 |
| 外部系统 / SDK / Client / Adapter | +1 |
| 跨租户 openService / openDAO | +1 |
| 迁移 / 灰度 / 回滚 / 发布顺序 | +1 |
| 多入口 API / 多业务主链路 | +1 |
| 资金、资产、权限、安全、敏感数据等高风险主题 | +1 |

默认 `Subtask Complexity <= 1`。若 `Subtask Complexity >= 2`，必须拆分；保留不拆时必须同时满足：

- 属于同一不可拆业务原子操作。
- 拆开后没有独立验收出口。
- 拆开会导致契约不稳定或大量重复上下文。
- 父计划写明 `Why not split`。
- 子任务验证方案覆盖每个复杂驱动。

## 过复杂任务拆分优先级

当子任务超出复杂度预算时，按以下顺序拆：

1. `migration-compat`：DDL、DML、回填、回滚、发布顺序。
2. `persistence-capability`：DAO/Mapper/Manager/OpenDAO 能形成契约时拆。
3. `external-adapter`：Client/SDK/Adapter、防腐层、超时重试、错误映射。
4. `async-worker`：MQ、事件、定时、补偿、重试、幂等消费。
5. `entry-api`：Endpoint/Controller/DTO/校验/错误码。
6. `business-service`：只保留业务原子链路、事务、状态和编排。

## Task Type

| Type | 职责 | 推荐 skill |
| --- | --- | --- |
| `persistence-capability` | DAO/Repository/Mapper/XML/PO/Query/OpenDAO/OpenMapper/薄 Manager | `server/persistence-impl` |
| `business-service` | Service/Facade 编排、事务、状态、权限、租户上下文、幂等 | `server/req-impl` |
| `async-worker` | 事件、MQ、定时、补偿、重试、死信、幂等消费 | `server/req-impl` |
| `entry-api` | Endpoint/Controller、DTO、参数校验、错误码、鉴权、YApi 契约 | `server/entry-impl` |
| `external-adapter` | Client/SDK/Adapter、防腐层、超时重试、错误映射 | `server/req-impl` 或专用 adapter skill |
| `migration-compat` | DDL、DML、回填、兼容、灰度、回滚、数据校验 | `server/data-model-design` 或实现专项 |
| `test-doc-review` | 单测、接口 mock、YApi、review | `server/test-codegen`、`server/yapi-mcp-sync`、`server/code-review` |

## 拆分规则

- 有表结构输入时，优先判断是否需要 `persistence-capability`；只有能形成稳定方法契约时才独立成任务。
- 业务主链路归入 `business-service`，包括当前租户 DAO、跨租户 openService/openDAO、事务和状态守卫。
- `business-service` 默认只保留 1 个核心复杂驱动；若同时包含外部适配、异步 worker、迁移回滚、独立跨租户能力、多入口 API 中任意 2 项，必须拆分或写明 `Why not split`。
- Endpoint/Controller 只承接对外协议和薄编排，不承接核心业务逻辑。
- 异步、事件、MQ、定时任务可归入业务层；若有独立触发入口、重试/补偿/幂等语义，拆成 `async-worker`。
- 外部集成只是业务下游调用时可纳入 `business-service`；需要 Client/Adapter 或独立失败语义时拆成 `external-adapter`。

## 停止与必须拆分

停止拆分：没有独立验收出口、只是机械改动、拆开会重复读取同一大段设计、文档成本高于验证收益。

必须拆分：表结构/兼容与业务混包、外部集成不明确、状态/事务/幂等是核心风险、异步补偿有独立失败语义、迁移/灰度/回滚有独立发布顺序、并行写入范围冲突。

## JIT 细化

- Executable Tasks：最近可执行的 1~3 个任务，写完整执行方案、接口字段、设计字段、验证方案和改动边界。
- Deferred Tasks：依赖上游契约尚未稳定的任务，只写标题、Task Type、依赖、验收出口和何时细化。
