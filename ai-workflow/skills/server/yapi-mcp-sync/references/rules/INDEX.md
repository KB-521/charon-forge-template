# YApi MCP Sync Rules

YApi 同步只加载本目录规则。

## 读取规则

- 先抽取 Endpoint、字段契约、分类、同步动作和缺口，再按“规则索引”只读取命中的本地规则文件。

## 规则索引

| 任务事实 | 读取规则 | 可跳过条件 |
| --- | --- | --- |
| Endpoint 扫描、字段级契约、YApi 分类、MCP upsert、失败清单 | `yapi-sync-rules.md` | 不执行 YApi 同步 |
