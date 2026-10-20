---
name: archive
description: 将一个或多个已完成的 SDD changes 变更包从 ai-workflow/sdd/changes 迁移到 ai-workflow/sdd/archive，并同步更新 ai-workflow/sdd/INDEX.md；用于用户要求归档、archive、批量归档、收口已完成变更包时。
version: 1.4.0
owners:
  - dachui
---

# SDD 变更包归档指南

## 目标

将一个或多个已经完成的 `ai-workflow/sdd/changes/<change-id>/` 迁移到 `ai-workflow/sdd/archive/<change-id>/`，并让 `ai-workflow/sdd/INDEX.md` 同步反映真实位置。

## 触发输入

- `$archive <change-id>`
- `$archive <change-id-1> <change-id-2>`
- `archive <change-id-1>, <change-id-2>`
- `归档 <change-id>`
- `批量归档 <change-id-1> <change-id-2>`

`<change-id>` 支持用空格、中文顿号、英文逗号或换行分隔。解析后必须去重并保持用户输入顺序。

## 必要上下文

1. 读取 `ai-workflow/sdd/INDEX.md`。
2. 读取每个目标变更包下的索引：
   - `ai-workflow/sdd/changes/<change-id>/tasks/INDEX.md`（如存在）
   - `tasks/INDEX.md` 中列出的父需求二级索引（如 `tasks/<parent-req>/INDEX.md`）
   - `ai-workflow/sdd/changes/<change-id>/design/INDEX.md`（如存在）
   - `design/INDEX.md` 中列出的设计包二级索引（如 `design/<design-package>/INDEX.md`）
3. 若用户没有指定任何 `<change-id>`，先列出 `ai-workflow/sdd/changes/` 下候选目录并请用户确认，不要自动归档全部。

## 归档门禁

归档前必须对每个 `<change-id>` 逐项确认。批量归档采用先校验、后迁移：只要任一变更包门禁失败，本轮全部停止，不做部分迁移。

1. `ai-workflow/sdd/changes/<change-id>/` 存在。
2. `ai-workflow/sdd/archive/<change-id>/` 不存在；若任一归档目标已存在，必须让用户确认覆盖/合并策略，禁止直接覆盖。
3. 目标变更包已完成：
   - 若 `tasks/INDEX.md` 存在，先按表格状态列和父需求索引路径判断父需求是否完成，不得用全文关键字扫描误伤目录规则说明。
   - 若存在父需求二级索引，应继续检查二级索引中的父需求状态、子任务状态和并行组状态；状态列里不得存在 `in-progress`、`Running`、`Ready`、`Blocked`、`NotReady` 等未完成状态。
   - 若没有 `tasks/INDEX.md`，必须有用户明确说明该变更包已完成，或 design/prd 文档能明确证明这是只读沉淀型变更。
4. 工作区可能包含他人改动；归档只移动本轮目标 `<change-id>` 目录和更新 `ai-workflow/sdd/INDEX.md`，不得顺手整理其他变更。

## 执行步骤

1. 创建归档目录：

```bash
mkdir -p ai-workflow/sdd/archive
```

2. 移动变更包：

```bash
git mv ai-workflow/sdd/changes/<change-id> ai-workflow/sdd/archive/<change-id>
```

批量归档时，对通过门禁的每个 `<change-id>` 逐个执行 `git mv`。若任一目录包含未跟踪文件导致 `git mv` 无法完整覆盖，先说明原因，再仅对对应目标目录使用普通 `mv` 补齐未跟踪文件；不要移动其他目录。

3. 更新 `ai-workflow/sdd/INDEX.md`：
   - 从“当前变更包”表中移除本轮所有 `<change-id>`。
   - 确保存在“归档变更包”表；若不存在则新增。
   - 在“归档变更包”表中逐个新增本轮 `<change-id>`，并把 PRD / Design / Tasks 路径改为 `ai-workflow/sdd/archive/<change-id>/...`。
   - 若 PRD 有多个文件，PRD 列指向 `ai-workflow/sdd/archive/<change-id>/prd/`；若无 PRD，填写 `-`。
   - 若 design/tasks 索引不存在，对应列填写 `-`，不得静默遗漏。
   - 若 design 采用 `design/<design-package>/INDEX.md` 二级索引，`Design` 列仍指向根 `design/INDEX.md`；二级索引由根 design 索引继续承接。

4. 更新归档包内部路径引用：
   - 在每个 `ai-workflow/sdd/archive/<change-id>/` 内搜索旧路径 `ai-workflow/sdd/changes/<change-id>`。
   - 对普通文档引用，替换为 `ai-workflow/sdd/archive/<change-id>`。
   - 对历史说明、命令输出、审查证据等保留原始语义更重要的内容，可以不替换，但必须在交付中说明。

## 验证

归档后至少执行：

```bash
test ! -e ai-workflow/sdd/changes/<change-id>
test -d ai-workflow/sdd/archive/<change-id>
rg "<change-id>" ai-workflow/sdd/INDEX.md
rg "ai-workflow/sdd/changes/<change-id>" ai-workflow/sdd/archive/<change-id> ai-workflow/sdd/INDEX.md
git diff --check ai-workflow/sdd/INDEX.md ai-workflow/sdd/archive/<change-id>
git status --short ai-workflow/sdd
```

批量归档时，上述 `test`、`rg` 和 `git diff --check` 必须覆盖本轮全部 `<change-id>`。

若旧路径搜索仍命中，检查每一处是否应替换或保留，并在最终回复说明。

## 输出要求

最终回复必须包含：

- 已归档的 `<change-id>`。
- 迁移前后路径；批量归档时逐个列出。
- `ai-workflow/sdd/INDEX.md` 的更新结果。
- 未替换的旧路径引用（若有）及原因。
- 验证命令结果摘要。
