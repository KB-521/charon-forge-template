# SQL Impl Rules

SQL 文件实现只加载本目录规则。Java 持久化骨架不在本 skill 内处理，统一转 server/skeleton-codegen。

## 读取规则

- 先抽取 SQL 类型、影响范围、执行顺序、风险和缺口，再按“规则索引”只读取命中的本地规则文件。
- 数据模型设计仍以 server/data-model-design 产物为输入真源。
- 规则冲突时，以当前 skill 本地规则和当前数据模型/SQL 契约为准。

## 规则索引

| 任务事实 | 读取规则 | 可跳过条件 |
| --- | --- | --- |
| 新增/修改表、字段、索引、唯一约束、默认值、注释 | `ddl-rules.md` | 不涉及 DDL |
| 初始化数据、配置数据、字典数据、数据修复、兼容回填 | `dml-rules.md` | 不涉及 DML |
| 大批量 SQL、文件名前缀序号、并行任务号段、manifest | `delivery-gates.md` | 单文件且无排序风险 |
| 验证、交付、剩余风险 | `delivery-gates.md` | 不可跳过 |
