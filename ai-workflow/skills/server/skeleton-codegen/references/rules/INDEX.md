# Skeleton Codegen Rules

持久化骨架代码生成只加载本目录规则。SQL 文件不在本 skill 内处理，统一转 server/persistence-impl。

## 读取规则

- 先抽取骨架产物、动作、风险和缺口，再按“规则索引”只读取命中的本地规则文件。
- 数据模型和 SQL 文件分别以 server/data-model-design、server/persistence-impl 产物为输入真源。
- 规则冲突时，以当前 skill 本地规则和当前数据模型/SQL 契约为准。

## 规则索引

| 任务事实 | 读取规则 | 可跳过条件 |
| --- | --- | --- |
| generator、PO、POQuery、DAO、Repository、Mapper XML、Manager | `skeleton-rules.md` | 不涉及 Java 持久化骨架 |
| 新增字段、字段用途不清、字段变更或兼容影响 | `skeleton-rules.md` | 不涉及字段变化 |
| 新增查询条件、分页、排序、批量读取、字段投影 | `skeleton-rules.md` | 不新增或修改查询能力 |
| 无同模块参考实现，需要独立生成 | `skeleton-rules.md` | 已有同模块参考实现 |
| 需要抽取同模块约定 | `skeleton-rules.md` | 无参考实现或默认生成 |
| sqlmapplus、OpenDAO、OpenMapper、跨租户、全局扫描、调度扫描、open 查询 | `skeleton-rules.md` | 不涉及 open 持久化骨架 |
| 验证、交付、方法契约、剩余风险 | `skeleton-rules.md` | 不可跳过 |
