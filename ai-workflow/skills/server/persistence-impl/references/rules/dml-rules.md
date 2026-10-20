# DML Rules

## 适用场景

新增或修改初始化数据、配置数据、字典数据、数据修复、历史兼容回填或清理数据时读取。

## 命中条件

| 维度 | 命中信号 |
| --- | --- |
| 产物 | DML、history compat、data fix、dict/config init、rollback/fixforward |
| 动作 | insert、upsert、update、delete、disable、repair、backfill |
| 风险 | 影响范围不明、不可重复执行、where 过宽、幂等缺失、回滚困难 |
| 可跳过 | 不涉及 DML |

## 门禁

- DML 必须说明数据来源、目标环境、影响范围和预期影响行数。
- insert/upsert 必须有唯一键、业务键或明确幂等依据。
- 无参考 SQL 时，初始化/配置/字典数据默认使用 `INSERT ... ON DUPLICATE KEY UPDATE`；没有唯一键或业务幂等键时输出 BLOCKER。
- update/delete 必须有强 where 条件；禁止无 where 或只按宽泛租户条件批量更新。
- 禁止从不可信输入拼接表名、列名、where、order by 或 values。
- 修复历史数据必须说明执行前校验 SQL 和执行后验收 SQL。
- 不可重复执行的 DML 必须显式标记，并给出人工确认步骤。
- 初始化数据默认显式写入 `STATUS`、`CREATE_BY`、`UPDATE_BY`；`CREATE_TIME`、`UPDATE_TIME` 由数据库维护，业务 SQL 禁止显式写入。

## 交付要求

| 项 | 必填内容 |
| --- | --- |
| 数据来源 | 设计配置、线上查询、字典枚举、人工清单 |
| 幂等依据 | 唯一键、业务键、where 条件或不可重复说明 |
| 影响范围 | 表、条件、预估行数、目标环境 |
| 校验 SQL | 执行前检查、执行后验收 |
| 失败策略 | 回滚、fixforward、重试或人工补救 |
| 默认规范 | 无参考时列出 upsert 幂等键、审计字段、数据库维护时间字段和重复执行语义 |
