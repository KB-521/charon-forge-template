# DDL Templates

DDL 必须根据冻结数据模型展开，不保留占位字段。

## Create Table

```sql
CREATE TABLE IF NOT EXISTS `<TABLE_NAME>`
(
    `ID` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `<BIZ_COLUMN>` <TYPE> <NULLABILITY> <DEFAULT> COMMENT '<COMMENT>',
    `STATUS` INT NOT NULL DEFAULT 1 COMMENT '数据状态（0-删除、1-正常）',
    `REMARK` VARCHAR(255) NULL COMMENT '备注',
    `CREATE_BY` VARCHAR(64) NULL COMMENT '创建人',
    `CREATE_TIME` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `UPDATE_BY` VARCHAR(64) NULL COMMENT '更新人',
    `UPDATE_TIME` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `ORG_CODE` VARCHAR(64) NULL COMMENT '组织编码',
    `TENANT_ID` BIGINT NULL COMMENT '租户ID',
    PRIMARY KEY (`ID`),
    UNIQUE KEY `UK_<TABLE>_<COLUMN>` (`<COLUMN>`),
    KEY `IDX_<TABLE>_<COLUMN>` (`<COLUMN>`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='<TABLE_COMMENT>';
```

要求：
- 基础字段和默认值按 `default-generation.md`。
- DDL 门禁按 `references/rules/ddl-rules.md`。
- `<TABLE_NAME>` 必须使用已确认表前缀；来源优先级为用户指定、项目/变更包文档、目标模块名、构建元信息、已有 SQL。从模块名识别项目标识时先剥离 `-domain`、`-dal`、`-biz`、`-web`、`-manager`、`-service`、`-api`、`-starter` 等技术分层后缀。未指定表前缀但已确认项目标识时，默认由项目标识派生为大写下划线前缀并追加 `_`，例如 `soyii-mobile-domain` -> `soyii-mobile` -> `SOYII_MOBILE_`；用户或已有 SQL 指定前缀时以指定前缀为准。无法确认时输出 BLOCKER，不生成新增表。
- 表名和字段名使用大写下划线；新增表名必须以已确认表前缀开头。
- 新增业务表默认包含 `ORG_CODE`、`TENANT_ID`；豁免时在 SQL 前写明原因。
- 索引必须来自唯一约束、查询条件、排序需求或外键关系。

## Verify

```sql
-- verify table exists
SELECT COUNT(1)
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = '<TABLE_NAME>';

-- verify columns
SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = '<TABLE_NAME>'
ORDER BY ORDINAL_POSITION;
```

## Rollback / Fixforward

```sql
-- rollback example for newly created table; only use before data is written
DROP TABLE IF EXISTS `<TABLE_NAME>`;
```

要求：
- 已发布且写入数据的表默认不直接 drop，优先给 fixforward 或人工确认步骤。

## Alter Table

```sql
ALTER TABLE `<TABLE_NAME>`
    ADD COLUMN `<COLUMN_NAME>` <TYPE> <NULLABILITY> <DEFAULT> COMMENT '<COMMENT>';
```

要求：
- 字段兼容、默认值、回填和唯一约束检查按 `references/rules/ddl-rules.md`。

## Index

```sql
ALTER TABLE `<TABLE_NAME>`
    ADD INDEX `IDX_<TABLE>_<COLUMN>` (`<COLUMN>`);
```

要求：
- 索引来源、命名和组合索引字段顺序按 `references/rules/ddl-rules.md`。
