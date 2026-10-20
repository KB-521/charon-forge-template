# Data Model And SQL Rules

## 适用场景

涉及逻辑模型、物理表结构、DDL 契约、schema delta、历史兼容 SQL 契约、字典或枚举时读取。

## 命中条件

| 维度 | 命中信号 |
| --- | --- |
| 产物 | 逻辑模型、物理 SQL、SQL 契约、delta、history compat、字典/枚举 |
| 动作 | 新增表、改字段、增索引、改唯一约束、补兼容 SQL 契约 |
| 风险 | 表结构漂移、基础字段缺失、码值不明、回滚不可执行 |
| 可跳过 | 不涉及数据模型或 SQL |

## 决策表

| 场景 | 规则 |
| --- | --- |
| 逻辑模型 | 必须先于物理 SQL 冻结，每条业务规则能追溯到 PRD、任务或已确认决策 |
| 表名前缀 | 新增表前必须先确认表前缀或项目标识；来源优先级：用户显式指定表前缀 > 变更包/PRD/设计/AGENTS/README 指定的项目名或表前缀 > 目标代码子项目/模块目录名 > Maven artifactId/module/package 等构建元信息 > 已有 SQL/表名约定；未指定表前缀但已确认项目标识时，默认将项目标识转大写下划线并追加 `_`，例如 `soyii-mobile` -> `SOYII_MOBILE_` |
| 表/字段命名 | 表名和字段名使用大写下划线；新增表名必须以已确认表前缀开头 |
| 新增核心表 | 默认包含 `ID`、`REMARK`、`STATUS`、`CREATE_BY`、`CREATE_TIME`、`UPDATE_BY`、`UPDATE_TIME`、`ORG_CODE`、`TENANT_ID` |
| 已有共享表 | 默认只输出 `ALTER TABLE` / `CREATE INDEX`，不重复展开整表快照 |
| 时间字段 | `CREATE_TIME` 使用 `datetime DEFAULT CURRENT_TIMESTAMP`；`UPDATE_TIME` 使用 `datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` |
| 状态/类型 | 字段注释必须包含字典类型编码和可解析码值 |
| 唯一约束 | 只用于必须强约束的业务唯一性；检索和排序使用普通索引 |

## SQL 目录与命名

路径表达变更和设计稿归属，文件名表达执行排序、任务和用途，manifest 表达最终执行顺序。禁止再为每个子任务创建 SQL 子目录；同一设计稿下的 SQL 放在同一个目录内。

### 设计侧目录

```text
ai-workflow/sdd/changes/<change-id>/design/<design-package>/sql/
├── manifest.md
├── 0100-REQ-XXX-01-schema-delta.sql
├── 0110-REQ-XXX-01-dict-init.sql
├── 0200-REQ-XXX-02-data-compat.sql
├── 0300-REQ-XXX-03-migration.sql
└── 0900-REQ-XXX-03-rollback.sql
```

### 运行侧目录

```text
server/docker-config/sql/<design-package>/
├── manifest.md
├── 0100-REQ-XXX-01-schema-delta.sql
├── 0110-REQ-XXX-01-dict-init.sql
├── 0200-REQ-XXX-02-data-compat.sql
├── 0300-REQ-XXX-03-migration.sql
└── 0900-REQ-XXX-03-rollback.sql
```

### 文件名

- 标准文件名：`<order>-<task-id>-<sql-kind>.sql`，例如 `0100-REQ-003-01-schema-delta.sql`。
- 标准 `sql-kind`：`schema-delta`、`dict-init`、`data-compat`、`migration`、`rollback`。
- 同一任务下存在多个同类 SQL 时，追加短语义：`0100-REQ-003-01-schema-delta-wallet-account.sql`、`0110-REQ-003-01-schema-delta-refund.sql`。
- `<task-id>` 必须来自任务 ID；`<order>` 必须来自父计划预分配 SQL 号段，使用四位数字，推荐按 10 递增。
- 文件名禁止使用日期或全局无归属递增号作为唯一性来源，例如 `20260704-001.sql`、`001.sql`。允许使用父计划分配的 `<order>` 作为设计稿内排序号。

### Manifest

设计侧 `design/<design-package>/sql/manifest.md` 和运行侧 `server/docker-config/sql/<design-package>/manifest.md` 必须记录执行顺序：

```markdown
| Order | Design | Task | File | Type | Idempotent | Rollback | Note |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 100 | D01-wallet-core | REQ-003-01 | 0100-REQ-003-01-schema-delta.sql | schema | Yes | No | 建表 |
```

`Order` 与文件名前缀保持一致；父计划需要为并行 task 预分配号段，例如 `REQ-XXX-01 -> 0100-0199`、`REQ-XXX-02 -> 0200-0299`。合并并行任务时优先调整 manifest；若文件名前缀与最终执行顺序冲突，必须同步改文件名和 manifest，不能只改一边。

## 门禁

- 敏感信息、账号、连接串、token、签名和密钥不得写入 SQL、注释、示例数据或文档。
- 表结构、字段、码值、索引和默认值必须来自 PRD、任务、源码、现有 SQL 或已确认输入；缺少来源时输出缺口。
- 新增表前必须先确认表名前缀：按“用户指定 > 项目/变更包文档 > 目标模块名 > 构建元信息 > 已有 SQL”的优先级确认；如果只能确认项目标识，则用项目标识派生前缀；如果派生结果和用户指定或已有 SQL 冲突，以用户指定或已有 SQL 为准。
- 从目标代码子项目/模块名识别项目标识时，先剥离技术分层后缀，如 `-domain`、`-dal`、`-biz`、`-web`、`-manager`、`-service`、`-api`、`-starter`；例如 `soyii-mobile-domain` 的项目标识是 `soyii-mobile`，表前缀派生为 `SOYII_MOBILE_`，不是 `SOYII_MOBILE_DOMAIN_`。
- 无法确认表前缀或项目标识时，必须输出 BLOCKER，不得生成新增表名。
- 业务 SQL 禁止显式写入 `CREATE_TIME` / `UPDATE_TIME`。
- 删除字段、改字段含义、改码值、改唯一约束时必须补兼容与回滚策略。
- 本 skill 只冻结 SQL 契约；真实 SQL 文件落地由 `server/persistence-impl` 承接。
- 新增增量、初始化、兼容、迁移、回滚 SQL 文件必须落在设计侧 `design/<design-package>/sql/` 和运行侧 `server/docker-config/sql/<design-package>/`。
- 同一个 SQL 需要 design 与 `server/docker-config/sql/` 双写时，两边文件名和内容必须一致。
- 新增独立 SQL 时必须更新设计侧和运行侧 manifest；执行顺序以 manifest 为准，文件名前缀用于大批量 SQL 的人工排序和发布辅助排序。
- 并行任务只能使用父计划分配给自己的 SQL 号段，不能占用或重排其他任务的号段。
- 只覆盖当前需求需要的数据模型和兼容口径；涉及旧数据或共享表时必须说明兼容、回滚和剩余风险。

## 交付要求

| 项 | 必填内容 |
| --- | --- |
| 逻辑模型 | 聚合、实体、关系、状态、枚举 |
| 物理 SQL | 表、字段、索引、默认值、注释和基础字段 |
| SQL 契约 | SQL 类型、双写目录、文件名、排序号段、manifest、幂等、执行依赖和表名前缀来源 |
| 兼容回滚 | history compat、回滚或补救方案 |
| 字典枚举 | 字典初始化、枚举变更和码值来源 |
| 持久化交接 | 查询条件、排序、唯一键、批量和 open 边界 |
| SQL manifest | 执行顺序、所属设计、所属任务、幂等、回滚和备注 |
| 交付证据 | 命中规则、输入来源、验证或未验证原因、剩余风险 |

## 高风险反例

- 只写物理 SQL，不写逻辑模型。
- 新增字段不说明兼容和回滚。
- SQL 文件名依赖当日递增序号表达唯一性或执行顺序。
- 多个并行任务在同一设计稿目录下抢占同一排序号段，导致 `0100-*.sql` 冲突。
