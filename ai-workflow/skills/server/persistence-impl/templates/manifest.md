# Manifest Template

用于生成 `manifest.md` 的表格骨架；执行顺序、双写一致性和交付门禁按 `references/rules/delivery-gates.md`。

```markdown
| order | file | type | target_db | purpose | dependency | idempotent | risk | status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0100 | 0100-REQ-XXX-01-schema-delta.sql | DDL | <db> | create/alter table | none | yes/no | low/medium/high | ready |
```

字段要求：
- `order`：与文件名前缀一致。
- `type`：DDL / DML / history-compat / rollback / fixforward / verify。
- `dependency`：依赖的 SQL order 或 none。
- `idempotent`：是否可重复执行。
- `risk`：锁表、数据修复、不可回滚等风险。
- `status`：draft / ready / executed / skipped。
