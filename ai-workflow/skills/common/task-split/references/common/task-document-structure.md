# 任务文档结构

## 设计输入

- 先读取 `design/INDEX.md` 定位设计包。
- 若存在 `design/<design-package>/INDEX.md`，继续读取命中的二级索引。
- 任务文档引用设计产物时使用真实路径，例如 `design/payment-wallet/<file>`，不要引用已下沉文件的旧根路径。

## 输出位置

- 根索引：`ai-workflow/sdd/changes/<change-id>/tasks/INDEX.md`
- 父需求目录：`ai-workflow/sdd/changes/<change-id>/tasks/REQ-XXX/`
- 父需求索引：`tasks/REQ-XXX/INDEX.md`
- 父计划：`tasks/REQ-XXX/REQ-XXX-split-plan.md`
- 子任务：`tasks/REQ-XXX/<design-code>-<task-slug>-<nn>.md`

## 子任务命名

- 父需求目录和父计划继续使用完整 `REQ-XXX`，不缩写父需求 ID。
- 子任务文件名默认使用 `<design-code>-<task-slug>-<nn>.md`，序号固定放在最后，便于先看设计包和任务含义。
- 子任务短码使用 `<design-code>-<nn>`，用于索引、沟通和并行队列。
- `design-code` 必须来自设计包短码，且在当前变更包内可区分其它设计包。
- `task-slug` 使用 2~5 个英文短词，表达任务边界，不重复完整父需求名。
- 子任务正文必须保留完整追溯字段：`Parent: REQ-XXX`、`Task: <design-code>-<nn>`、`Design: <design-package>`。
- 示例：
  - 文件：`GPLAY-SUB-app-sub-page-04.md`
  - 短码：`GPLAY-SUB-04`
  - 标题：`# GPLAY-SUB-04 App 订阅页`

## 索引职责

- 根 `tasks/INDEX.md`：只维护父需求 ID、父需求索引、拆分计划、状态、范围和进度摘要。
- 父需求 `INDEX.md`：维护子任务清单、状态、依赖、并行标注、并行执行队列、写入范围和合并顺序。
- 子任务文档：维护任务执行方案、验收标准、并行边界、改动边界和执行摘要。

## 状态规则

- 目录只表达父需求归属，不表达状态。
- 同一父需求必须使用同名目录 `tasks/REQ-XXX/`。
- 禁止按状态拆成 `in-progress/`、`completed/` 等目录。
- 子任务进入 `Implemented/Done` 后只更新索引和执行摘要，不移动文件。
