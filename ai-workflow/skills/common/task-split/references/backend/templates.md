# 后端模板

模板只定义必填章节；公共块读取 `../common/template-blocks.md`，字段规则读取 `granularity.md`、`dependency.md` 与 `../common/INDEX.md`。

## 父计划必填章节

- `# [REQ-XXX] 实现拆分计划`
- `## 摘要`
- `## Resume Summary / 执行摘要`：引用 `../common/template-blocks.md#resume-summary`
- `## 输入文档`：PRD、后端设计、API 契约、数据模型/表结构
- `## Complexity / 复杂度`
- `## 拆分策略`
- `## Subtask Complexity Budget`
- `## Why Not Split`
- `## Refinement Plan / 细化计划`
- `## 批次规划`
- `## Parallel Queue / 并行执行队列`：引用 `../common/template-blocks.md#parallel-queue`，并同步到父需求 `INDEX.md`
- `## 共享契约`：DTO、枚举、表结构、API、事件、错误码
- `## SQL Namespace`
- `## Trace Matrix / 功能点追溯矩阵`：引用 `../common/template-blocks.md#trace-matrix`
- `## 发布与质量门禁`
- `## 风险与待确认`

## 父计划关键表

```markdown
## Complexity / 复杂度
- Score：
- Level：XS / S / M / L / XL
- Split Budget：
- Actual Task Count：
- Why not more：
- Why not less：

## Subtask Complexity Budget
| Task Code | Type | Complexity Drivers | Score | Decision |
| --- | --- | --- | --- | --- |

## SQL Namespace
| Source | Source Type | Design | SQL Directory | SQL Order Range | Allowed SQL Kind |
| --- | --- | --- | --- | --- | --- |
```

## 子任务必填章节

- `# <design-code>-<nn> 子需求标题`
- 元信息：`Parent: REQ-XXX`、`Task: <design-code>-<nn>`、`Design: <design-package>`、`File: <design-code>-<task-slug>-<nn>.md`
- `## 摘要`
- `## Resume Summary / 执行摘要`：引用 `../common/template-blocks.md#resume-summary`
- `## Task Type`
- `## Subtask Complexity`
- `## 范围`
- `## 验收标准`
- `## 模块落点`
- `## 任务执行方案`
- `## 依赖`
- `## Parallel Boundary / 并行执行边界`：引用 `../common/template-blocks.md#parallel-boundary`
- `## Change Boundary / 改动边界`：引用 `../common/template-blocks.md#change-boundary`
- `## 交付定义（DoD）`

## 子任务关键字段

```markdown
## Task Type
- Type：
- Recommended Skill：
- Required Contracts：
- Handoff Output：
- Refinement Level：Full / Outline

## Subtask Complexity
- Drivers：
- Score：
- Decision：Keep / Split
- Why not split：
- Validation for each driver：
```

## 结果输出格式

```markdown
## 拆分结果
- 父需求：
- Complexity：
- 子需求数量：
- 批次数量：
- Executable Tasks：
- Deferred Tasks：

## 覆盖检查
- 功能点总数：
- 已覆盖：
- 未覆盖：
- 粒度超限子任务数：
```
