---
name: req-dev
description: AI 任务统一入口与执行门禁（强制流程）
version: 1.4.0
owners:
  - dachui
---

# 目标

统一所有任务的入口编排，确保每次先加载 Memory，并通过 Router 选中且加载目标 Agent。

# 何时使用

- 任意需求、设计、实现、评审、记录类任务。

# 强制执行流程（必须按顺序）

```
User Task
  -> Load Memory(ai-workflow/memory/INDEX.md -> indexed files)
  -> Route & Load Agent(ai-workflow/agent/phase-router.md -> ai-workflow/agent/*.md)
  -> Follow Agent Workflow
```

## Step 0. Load Memory（必做）

1. 读取 `ai-workflow/memory/INDEX.md`。
2. 按索引读取列出的 memory 文件；标记为可选的文件不存在时跳过。
3. 提取团队偏好、个人偏好与阶段性执行约定。
4. Memory 是唯一自定义偏好入口；业务、技术或 SDD 内容仍按 Agent 需要下钻。

## Step 1. Route & Load Agent（必做）

1. 读取 `ai-workflow/agent/phase-router.md`。
2. 根据 Router 判断：意图、复杂度、目标 Agent。
3. 读取目标 Agent 文件（如 `ai-workflow/agent/requirement-manager.md`）。

# 并行任务入口门禁

当语义判断用户目标是让同一并行组内的多个子任务同时推进时，才判定为并行执行意图。

- 普通执行意图下，即使父需求 `INDEX.md` 中某组标为可并行，也只说明具备并行可能，不自动启动多个 subagents。
- 判定为并行执行意图后，必须交给 `ai-workflow/skills/common/codex-parallel-execute/SKILL.md` 执行具体并行校验、worktree 准备、worker 提示词与调度。
- 若 `codex-parallel-execute` 未命中、缺失或不可读，禁止启动正式业务并行，只能说明 fallback 与影响。
- 并行边界、任务基线、worktree、subagent/worker、串行 fallback 等细则由 `codex-parallel-execute` 维护，`req-dev` 只保留入口级门禁。

# 执行门禁（Gate）

- Gate 1：未完成 Step 0~1，禁止进入具体任务执行。
- Gate 2：进入 `Follow Agent Workflow` 后，必须遵循已加载 Agent 的上下文、技能、工作流、输出与自检要求。
- Gate 3：最终回复必须包含实际使用的 Agent；若 Agent 工作流实际使用 skill，也必须列出 skill；若未使用 skill，说明未使用或未命中。
- Gate 4：已判定为并行执行意图但未执行 `codex-parallel-execute`，禁止启动正式业务并行。
- Gate 5：`codex-parallel-execute` 的并行门禁失败时，禁止绕过该 skill 直接并行执行。

# 最小输出模板

```markdown
## 意图分析
- 输入：
- 意图：
- 复杂度：

## 上下文事实
- 已加载 Memory：
- 已加载 Agent：
- Agent 工作流下钻的索引/文档/代码事实：
```

# 目录指引

| 目录 | 用途 |
| --- | --- |
| `ai-workflow/agent/` | 代理角色定义 |
| `ai-workflow/memory/` | 团队偏好、个人偏好与阶段性执行约定 |
| `ai-workflow/skills/` | 可复用工作流技能 |
| `ai-workflow/wiki/` | 项目知识库 |
| `ai-workflow/sdd/` | 统一需求管理 |
| `ai-workflow/mcp/` | 外部工具配置 |
| `app/` | 移动端项目源代码（React Native / Expo） |
| `web/` | 前端项目源代码 |
| `server/` | 后端项目源代码 |
| `ai-workflow/reference/` | 参考实现 |
