# 后端依赖与并行

## 默认依赖方向

1. 表结构/迁移 -> 持久化能力。
2. 持久化方法契约 -> 业务服务。
3. 业务服务契约 -> Entry API。
4. 业务事件定义 -> 异步/MQ/定时任务。
5. 外部 Client/Adapter 契约 -> 业务服务或异步任务。
6. API 契约和实现稳定 -> YApi、测试。

## 阻塞判断

命中以下情况必须标记 `Blocked`：

- 表结构、DTO、枚举、错误码或接口契约未确定。
- 同一文件需要多任务同时修改，且无法通过顺序合并降低冲突。
- 外部系统契约、鉴权、租户访问方式或失败语义未确认。
- 数据迁移顺序会影响业务代码验证。

## 后端改动边界

子任务按下列维度写清允许修改和禁止修改：

- `domain`
- `biz`
- `dal`
- `manager`
- `web/endpoint/controller`
- `tests`
- 共享契约：DTO、枚举、表结构、API、事件、错误码。

## SQL 写入边界

命中表结构、字典、兼容、迁移或回滚 SQL 时，父计划必须预分配设计稿 SQL 目录和每个 task 的 SQL 排序号段：

| Source | Source Type | Design | SQL Directory | SQL Order Range | Allowed SQL Kind |
| --- | --- | --- | --- | --- | --- |
| OP-ORDER-01 | task | c-domain-operation-order | `c-domain-operation-order/` | `0100-0199` | `schema-delta`, `dict-init` |

规则：

- 设计侧写入 `design/<design-package>/sql/`。
- 运行侧写入 `server/docker-config/sql/<design-package>/`。
- 文件名使用 `<order>-<source-id>-<sql-kind>.sql`，例如 `0100-OP-ORDER-01-schema-delta.sql`、`0110-OP-ORDER-01-dict-init.sql`。
- 拆分任务场景下，`source-id` 必须使用对应 `Task Code`；无拆分任务且由技术方案直接生成 SQL 时，`source-id` 使用 `design-id`。
- 执行顺序写入 manifest；文件名前缀必须来自父计划分配号段，用于大批量 SQL 的人工排序和发布辅助排序。
- 并行任务只能写自己号段内的 SQL 文件和 manifest 行，不能占用、重排或修改其他任务号段内的 SQL。

并行队列、worktree 和通用边界规则读取 `../common/parallel-boundary.md`。
