# SQL Delivery Gates

## 适用场景

`server/persistence-impl` 交付前必须读取。

## 命中条件

| 维度 | 命中信号 |
| --- | --- |
| 产物 | DDL、DML、history compat、rollback/fixforward、manifest |
| 动作 | 新增 SQL 文件、修改 SQL 文件、准备交付 |
| 风险 | 执行顺序错误、影响范围不明、不可重复、无补救 |
| 可跳过 | 不可跳过 |

## 门禁

| 门禁 | 要求 |
| --- | --- |
| 数据模型 | 已引用冻结的数据模型、SQL 契约、字段语义或明确缺口 |
| 双写路径 | 已写入 `design/<design-package>/sql/` 和 `server/docker-config/sql/<design-package>/`，且文件名、内容一致 |
| 文件排序 | SQL 文件名可排序，manifest 已更新或说明不需要 |
| DDL | 表、字段、索引、默认值、兼容影响已说明 |
| DML | 数据来源、where、幂等、影响行数、校验 SQL 已说明 |
| 回滚补救 | 已提供 rollback、fixforward 或不可回滚原因 |
| 分层边界 | 未生成 Java 持久化骨架；如需要已转 `server/skeleton-codegen` |
| 验证 | 已执行 dry-run/schema diff/重复执行检查，或说明未执行原因 |
| 默认规范 | 无参考 SQL 时已说明使用 `default-generation.md`，并列出默认字段、默认值、幂等依据和文件排序 |
| 执行顺序 | DDL 通常先于依赖它的 DML；兼容回填和修复 SQL 已声明依赖 |
| Manifest | 设计侧和运行侧 manifest 已记录文件名、类型、目标库、执行顺序、依赖、风险和状态 |
| 敏感信息 | SQL、注释、样例数据和交付说明不包含 token、账号、密码、签名、连接串和密钥 |
| 真实来源 | 表结构、字段、码值、数据来源和 where 条件来自数据模型、源码、现有 SQL 或已确认输入 |
| 最小范围 | 只生成当前 SQL 文件闭环，不生成 Java 骨架、Service、Endpoint 或无关修复 |
| 兼容风险 | 涉及旧数据、共享表、锁表、唯一约束或资金资产链路时已说明兼容、回滚和剩余风险 |

## 交付格式

| 项 | 内容 |
| --- | --- |
| 输入引用 | data-model-design 产物和缺口 |
| SQL 文件 | 设计侧和运行侧 DDL、DML、history compat、rollback/fixforward、manifest |
| 执行说明 | 顺序、目标库、影响范围、幂等、风险 |
| 验证结果 | 命令、PASS/FAIL/NOT_RUN |
| 后续路由 | 需要 Java 骨架时转 `server/skeleton-codegen` |
| 剩余风险 | 性能、锁表、兼容、回滚、人工确认 |

## 排序和 Manifest

- 每个设计稿一个 SQL 目录；同一设计稿的所有 SQL 放在同一个目录下。
- 设计侧目录固定为 `design/<design-package>/sql/`，运行侧目录固定为 `server/docker-config/sql/<design-package>/`。
- 文件名前缀使用四位可排序序号，序号放在最前面用于执行排序。
- 无参考 SQL 时，默认按 `0100` 起步，单设计稿内间隔 10 或 100。
- 并行任务使用不同预留号段，避免互相改同一个序号。
- 多 SQL 文件必须维护 manifest；单文件也建议说明执行顺序。
