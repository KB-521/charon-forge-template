# Worktree 命令模板

## 创建或确认 worktree

```bash
bash ~/.codex/skills/git-worktree/scripts/worktree-manager.sh create task-<task-id> <base-branch>
```

## 命名约定

- `<task-id>` 使用子任务编号，保持和任务文档一致。
- 分支名和 worktree 目录名使用 `task-<task-id>`，避免在 `.worktrees/` 下生成嵌套目录。
- `<base-branch>` 使用已经包含任务基线的分支或快照点。

## 基线可见性校验

```bash
test -f <worktree-path>/ai-workflow/sdd/changes/<change-id>/tasks/INDEX.md
test -f <worktree-path>/ai-workflow/sdd/changes/<change-id>/tasks/<parent-req>/INDEX.md
test -f <worktree-path>/<task-doc-path>
```

缺少任一任务基线文件时，禁止启动正式 worker。
