---
name: task-split
description: 将技术方案拆分为可开发、可验收、可并行执行的实现子任务。
version: 1.10.2
owners:
  - dachui
  - sunwencong
---

## 使用流程

1. 先读取 `references/common/INDEX.md`，确认任务目录、设计输入、并行边界和恢复摘要规则。
2. 后端技术方案拆分读取 `references/backend/INDEX.md`。
3. 前端技术方案拆分读取 `references/frontend/INDEX.md`。
4. 拆分完成后运行 `scripts/check_task_split.py` 做结构自检。

## 输出约束

- 根 `tasks/INDEX.md` 只维护父需求索引。
- 父需求 `tasks/REQ-XXX/INDEX.md` 承接子任务清单、状态、依赖和并行队列。
- 父计划和子任务必须落在 `tasks/REQ-XXX/`，完成后只更新状态，不移动文件。
- 子任务数量由复杂度、页面清单和独立验收出口决定，不使用固定数量下限。

## 子任务命名

- 父需求目录继续使用完整 `REQ-XXX`，保证全局唯一和历史可追溯。
- 新增子任务文件名默认使用短码格式：`<design-code>-<task-slug>-<nn>.md`，序号固定放在最后。
- 子任务短码使用 `<design-code>-<nn>`，例如 `GPLAY-SUB-04`。
- `design-code` 来自设计包短码，必须能和同一变更包下其它设计区分，例如 `GPLAY-SUB`、`APPLE-SUB`、`PAY-REFUND`、`WALLET`、`OP-ORDER`。
- `task-slug` 用 2~5 个英文短词表达任务含义，例如 `provider-adapter`、`measure-handler`、`app-sub-page`。
- 建议 worktree 使用 `task-<design-code-lower>-<nn>`，建议分支使用 `task/<design-code-lower>-<nn>`。
- 子任务正文必须保留 `Parent: REQ-XXX`、`Task: <design-code>-<nn>`、`Design: <design-package>`，避免短文件名丢失完整追溯。
- 已存在的长文件名任务不强制迁移；新拆任务默认使用本规则。
