# Service Boundary

## 适用场景

生成或修改 Service、ServiceImpl、Facade、Domain Service、业务编排方法、业务组件落点时读取。

## 命中条件

| 维度 | 命中信号 |
| --- | --- |
| 产物 | Service、Facade、Domain Service、业务组件、业务方法 |
| 动作 | 新增业务流程、修改业务分支、抽取复用能力、调整分层落点 |
| 风险 | 入口堆业务、Service 直接拼 SQL、跨层调用、职责漂移 |
| 可跳过 | 不涉及业务层实现 |

## 决策表

| 场景 | 默认落点 | 禁止事项 |
| --- | --- | --- |
| 核心业务规则 | Service/Facade 主链路 | 放到 Endpoint/Controller/Job/Consumer |
| 领域内复用校验 | Domain Service 或项目等价组件 | 为单接口新增无意义抽象 |
| 持久化读写 | 调用已确认 Manager/DAO/OpenService 能力 | Service 内手写复杂 SQL |
| HTTP 协议适配 | 转 `server/entry-impl` | 在业务层处理路由和响应包装 |
| 缺 SQL/schema/兼容数据 | 转 `server/persistence-impl` | Service 内手写复杂 SQL |
| 缺 DAO/Mapper/Manager/OpenDAO | 转 `server/skeleton-codegen` | 临时绕过 DAO/Mapper 约定 |

## 门禁

- 业务规则、权限、状态、幂等和事务必须收口在 Service/Facade 或等价业务组件。
- Job/Consumer/EventHandler 只做触发、解析、锁、ack/nack、重试和调用 service。
- 目标项目源码、相似实现和已确认契约优先；禁止猜包名、类名、方法名或配置。

## 交付要求

| 项 | 必填内容 |
| --- | --- |
| 业务落点 | Service/Facade/Domain Service/Worker 组件 |
| 调用边界 | 调用的持久化能力、外部能力和入口契约 |
| 不做项 | 本轮不处理的入口、持久化、测试或文档事项 |
| 缺口 | 缺少 service 契约、持久化方法、外部能力或入口字段时说明 |

## 高风险反例

- Endpoint 直接串完整业务流程。
- Service 直接穿透 Mapper XML 或拼 SQL。
- 业务层新增和现有模块风格不一致的临时组件。
