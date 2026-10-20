# Default SQL Generation

无参考 SQL 时，按本文件独立生成 DDL/DML/manifest。默认规范只能补基础结构和安全写法，业务字段、业务数据和索引仍必须来自冻结的数据模型。

## 默认文件和排序

| 类型 | 默认文件名 |
| --- | --- |
| schema delta / DDL | `<order>-<task-id>-schema-delta.sql` |
| dictionary / config init | `<order>-<task-id>-dict-init.sql` 或 `<order>-<task-id>-config-init.sql` |
| history compat | `<order>-<task-id>-history-compat.sql` |
| data fix | `<order>-<task-id>-data-fix.sql` |
| rollback / fixforward | `<order>-<task-id>-rollback.sql` 或 `<order>-<task-id>-fixforward.sql` |

默认同一设计稿一个 `sql/` 目录：设计侧 `design/<design-package>/sql/`，运行侧 `server/docker-config/sql/<design-package>/`。序号用四位数字，建议间隔 10 或 100，方便并行任务预留号段。

两侧目录都维护 `manifest.md`；SQL 文件名、内容和执行顺序必须一致。

## 默认 DDL

新增表名前必须先确认表名前缀：
- 来源优先级：用户显式指定表前缀 > 变更包/PRD/设计/AGENTS/README 指定的项目名或表前缀 > 目标代码子项目/模块目录名 > Maven artifactId/module/package 等构建元信息 > 已有 SQL/表名约定。
- 从模块名识别项目标识时，先剥离技术分层后缀，如 `-domain`、`-dal`、`-biz`、`-web`、`-manager`、`-service`、`-api`、`-starter`；例如 `soyii-mobile-domain` -> `soyii-mobile`。
- 未指定表前缀但已确认项目标识时，默认将项目标识转大写下划线并追加 `_`，例如 `soyii-mobile` -> `SOYII_MOBILE_`。
- 如果冻结数据模型、现有项目 SQL 或用户输入已指定表前缀，则使用指定前缀，例如 `SOYII_`、`SOYII_MERCHANT_`；派生结果与指定前缀冲突时，以指定前缀为准。
- 无法确认表前缀或项目标识时，输出 BLOCKER，不生成新增表 SQL。
- 表名和字段名使用大写下划线；新增表名必须以已确认表前缀开头。

| 项 | 默认值 |
| --- | --- |
| 引擎 | `ENGINE=InnoDB` |
| 字符集 | `DEFAULT CHARSET=utf8mb4` |
| 主键 | `ID BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID'` |
| 主键约束 | `PRIMARY KEY (ID)` |
| 状态字段 | `STATUS INT NOT NULL DEFAULT 1 COMMENT '数据状态（0-删除、1-正常）'` |
| 备注字段 | `REMARK VARCHAR(255) NULL COMMENT '备注'` |
| 创建人 | `CREATE_BY VARCHAR(64) NULL COMMENT '创建人'` |
| 创建时间 | `CREATE_TIME DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'` |
| 更新人 | `UPDATE_BY VARCHAR(64) NULL COMMENT '更新人'` |
| 更新时间 | `UPDATE_TIME DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'` |
| 租户字段 | `TENANT_ID BIGINT NULL COMMENT '租户ID'` |
| 组织字段 | `ORG_CODE VARCHAR(64) NULL COMMENT '组织编码'` |

新增业务表默认包含 `TENANT_ID`、`ORG_CODE`；确认为无租户/组织隔离表时可豁免，并在设计和交付中记录原因。

常见可选字段：
- `ENABLED TINYINT NOT NULL DEFAULT 1 COMMENT '是否启用 0:否/1:是'`：配置、开关、主数据表。
- `SORT_NO INT NOT NULL DEFAULT 0 COMMENT '排序'`：列表展示或排序表。
- `VERSION INT NOT NULL DEFAULT 1 COMMENT '版本号'`：配置版本、文案版本。
- `IS_DEFAULT TINYINT NOT NULL DEFAULT 0 COMMENT '是否默认 0:否/1:是'`：默认项标识。

默认索引：
- 主键索引必须有。
- 唯一键只根据数据模型唯一约束生成。
- 普通索引只根据查询条件、外键、状态过滤、排序需求生成，不凭空加。
- 高频组合查询优先生成组合索引，字段顺序按等值条件、范围条件、排序字段排列。

## 默认 DML

- 初始化/配置/字典数据默认使用可重复执行写法：`INSERT ... ON DUPLICATE KEY UPDATE`。
- 没有唯一键或业务幂等键时，不生成默认 insert，输出 BLOCKER。
- `UPDATE` / `DELETE` 必须有强 where 条件和预期影响行数。
- 数据修复必须同时给出执行前检查 SQL 和执行后验收 SQL。
- DML 默认显式写入 `STATUS`、`CREATE_BY`、`UPDATE_BY`；`CREATE_TIME`、`UPDATE_TIME` 由数据库默认值和自动更新维护，业务 SQL 禁止显式写入。

## 默认交付说明

使用默认规范时，交付必须写明：
- 无参考 SQL，已按默认规范生成。
- SQL 目录、序号、目标库、表名、基础字段和默认值。
- 表名前缀来源：用户指定、项目/变更包文档、目标模块名、构建元信息、现有 SQL，或按已确认项目标识默认派生。
- 已说明 design 与 `server/docker-config/sql/<design-package>/` 双写一致。
- DDL 索引来源、DML 幂等依据、影响范围和回滚/补救方式。
