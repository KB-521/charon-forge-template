---
name: codex-parallel-execute
description: 基于父需求 INDEX.md 的 Ready 并行组，校验并行边界、任务基线可见性和 worktree 隔离，并编排 Codex worker/subagent 并行执行。用户要求并行执行任务组时使用。
version: 1.6.0
owners:
  - dachui
  - sunwencong
---

# Codex 并行执行编排

## 目标

- 将 `ai-workflow/sdd/changes/<change-id>/tasks/<parent-req>/INDEX.md` 中的 Ready 并行组转换为可执行的隔离 worker 队列。
- 主线程只负责编排、校验、启动、等待和整合结果，不直接实现业务代码。
- 正式业务并行必须使用独立 git worktree；forked workspace 只能作为流程测试 fallback。

## 适用场景

- 用户明确要求并行执行某个任务组。
- 父需求 `INDEX.md` 中存在 `Ready` 状态的并行组。
- 每个子任务已有任务文档，并写明 `并行执行边界`、`改动边界`、依赖、允许修改范围和禁止修改范围。

## 输入

- `change-id`。
- 并行组 ID，例如 `G1`、`G2`。
- 根任务索引：`ai-workflow/sdd/changes/<change-id>/tasks/INDEX.md`，用于定位父需求入口。
- 父需求索引：`ai-workflow/sdd/changes/<change-id>/tasks/<parent-req>/INDEX.md`，用于读取并行组、子任务状态和边界。
- 并行组内每个子任务文档。
- 任务基线：根任务索引、父需求索引、子任务文档、依赖设计文档、共享契约文档或拆分说明。
- 设计基线若采用分包目录，必须包含根 `design/INDEX.md`、命中的 `design/<design-package>/INDEX.md` 和具体设计文档。

## 执行模式

- 正式并行执行：默认模式。每个 worker 绑定独立 worktree，并只修改自己的允许范围。
- 编排计划：用户只要计划、环境不支持 subagents，或门禁失败时使用；只输出命令、worker prompt 和阻塞说明。
- 流程测试 fallback：仅用于验证流程或用户明确接受临时验证；必须说明这不是正式业务并行模式。

## 执行流程

1. 读取根 `tasks/INDEX.md` 定位父需求入口，再读取父需求 `INDEX.md` 定位用户指定并行组。
2. 确认并行组状态为 `Ready`，否则停止。
3. 读取组内子任务文档，提取依赖、允许修改范围和禁止修改范围。
4. 校验每个子任务是否包含 `并行执行边界` 与 `改动边界`。
5. 检查允许修改范围是否重叠：
   - 无重叠：允许并行。
   - 有重叠但存在共享契约任务：先执行共享契约任务，再并行下游任务。
   - 有重叠且没有共享契约任务：禁止并行，要求重新拆分或收窄边界。
6. 汇总任务基线文件清单，并确认每个目标 worktree 都能读取。
7. 通过 `git-worktree` manager script 创建或确认每个子任务的独立 worktree。
8. 在每个 worktree 内校验任务基线文件可读。
9. 按需读取 `templates/worker-prompt.md`，为每个 worker 生成提示词。
10. 正式模式下启动 Codex worker/subagent，并声明其不是唯一执行者、不得回滚其他 worker 改动。
11. 等待 worker 完成后，按子任务边界检查 diff，整合结果并输出状态更新建议。
12. 不自动触发测试、集成测试或 code review，除非用户明确要求。

## 硬门禁

- Gate 1：并行组不存在或不是 `Ready`，禁止启动。
- Gate 2：任一子任务缺少 `并行执行边界`，禁止启动。
- Gate 3：任一子任务缺少 `改动边界`，禁止启动。
- Gate 4：允许修改范围重叠且没有共享契约任务，禁止并行。
- Gate 5：主线程不得直接实现业务代码。
- Gate 6：未得到用户明确要求时，不自动运行单元测试、集成测试或 code review。
- Gate 7：已判定为并行执行意图且运行环境支持 subagents 时，禁止退化为主线程串行实现。
- Gate 8：每个 worker 必须声明“不是唯一执行者”，并严格遵守自己的 `改动边界`。
- Gate 9：任务基线未对每个目标 worktree 可见，禁止启动 worker。
- Gate 10：正式业务并行中，每个 worker 必须绑定独立 worktree；未绑定时只能作为流程测试 fallback。
- Gate 11：worktree 创建必须优先使用 `git-worktree` manager script，不把裸 `git worktree add` 作为标准流程。

## 按需读取

- 准备 worktree 命令时读 `templates/worktree-commands.md`。
- 生成 worker 初始任务时读 `templates/worker-prompt.md`。
- 输出编排结果或计划时读 `templates/output-report.md`。

## 完成标准

- 并行组状态、依赖、边界和任务基线可见性已校验。
- 每个正式 worker 都有独立 worktree、明确允许范围和禁止范围。
- 已输出启动顺序、worker 状态、集成注意事项和阻塞说明。
- 若门禁失败，停止执行并给出需要用户或任务拆分阶段处理的具体原因。
