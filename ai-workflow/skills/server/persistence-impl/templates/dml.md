# DML Templates

DML 必须可重复执行，或显式标记不可重复并给出人工确认步骤。

## Init / Config / Dictionary Upsert

```sql
INSERT INTO `<TABLE_NAME>`
(`BIZ_KEY`, `BIZ_VALUE`, `STATUS`, `CREATE_BY`, `UPDATE_BY`)
VALUES
('<biz-key>', '<biz-value>', 1, 'system', 'system')
ON DUPLICATE KEY UPDATE
    `BIZ_VALUE` = VALUES(`BIZ_VALUE`),
    `STATUS` = VALUES(`STATUS`),
    `UPDATE_BY` = VALUES(`UPDATE_BY`);
```

要求：
- 必须有唯一键或业务幂等键。
- 初始化数据来源必须来自设计、字典枚举或配置清单。

## Data Fix

```sql
-- pre-check
SELECT COUNT(1)
FROM `<TABLE_NAME>`
WHERE <strong_where>;

-- fix
UPDATE `<TABLE_NAME>`
SET `<COLUMN_NAME>` = <value>,
    `UPDATE_BY` = 'system'
WHERE <strong_where>;

-- post-check
SELECT COUNT(1)
FROM `<TABLE_NAME>`
WHERE <expected_condition>;
```

要求：
- `WHERE` 必须足够强，必须给出预期影响行数。
- 大批量修复必须说明分批策略和执行窗口。

## Delete / Disable

优先软删除：

```sql
UPDATE `<TABLE_NAME>`
SET `STATUS` = 0,
    `UPDATE_BY` = 'system'
WHERE <strong_where>;
```

物理删除必须有明确设计结论、备份/回滚或不可回滚说明。
