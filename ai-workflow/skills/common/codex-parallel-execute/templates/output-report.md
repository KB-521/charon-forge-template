# 并行执行输出模板

````markdown
## 并行组校验

- change-id:
- 并行组:
- 状态:
- 执行模式:
- 任务基线:
- 结论:

## 子任务边界检查

| task-id | 状态 | 前置依赖 | 允许修改范围 | 禁止修改范围 | 是否可并行 | 备注 |
| --- | --- | --- | --- | --- | --- | --- |

## 任务基线可见性

| 文件 | 主工作区 | worktree 可见性 | 处理方式 |
| --- | --- | --- | --- |

## Worktree 命令

```bash
bash ~/.codex/skills/git-worktree/scripts/worktree-manager.sh create task-<task-id> <base-branch>
```

## Codex Worker 提示词

### <task-id>

```markdown
<worker-prompt>
```

## 启动顺序

1. 先启动共享契约任务或无依赖任务。
2. 再启动同组内边界互不重叠的任务。
3. 等待 worker 完成后，由主工作区负责集成。

## Worker 执行结果

| task-id | worktree | worker | 状态 | 修改文件 | 集成注意事项 |
| --- | --- | --- | --- | --- | --- |

## 阻塞或冲突

- 无：
- 有：
````
