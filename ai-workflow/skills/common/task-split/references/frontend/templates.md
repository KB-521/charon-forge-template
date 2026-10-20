# 前端模板

模板只定义必填章节；公共块读取 `../common/template-blocks.md`，字段规则读取 `page-slicing.md`、`dependency-and-parallel.md` 与 `../common/INDEX.md`。

## 父计划必填章节

- `# [REQ-XXX] 前端实现拆分计划`
- `## 摘要`
- `## Resume Summary / 执行摘要`：引用 `../common/template-blocks.md#resume-summary`
- `## 输入文档`：PRD、前端技术方案、原型/交互稿、API 契约
- `## 拆分策略`
- `## 页面清单`
- `## 一页一子需求映射`
- `## 批次规划`
- `## Parallel Queue / 并行执行队列`：引用 `../common/template-blocks.md#parallel-queue`，并同步到父需求 `INDEX.md`
- `## Trace Matrix / 功能点追溯矩阵`：引用 `../common/template-blocks.md#trace-matrix`，前端必须补 PageKey 和页面
- `## 风险与待确认`

## 父计划关键表

```markdown
## 页面清单
| PageKey | 页面 | 路由 | 角色 | 核心业务逻辑 | 关键接口 |
| --- | --- | --- | --- | --- | --- |

## 一页一子需求映射
| PageKey | 页面 | Task Code | 文件 | 说明 |
| --- | --- | --- | --- | --- |
```

## 子任务必填章节

- `# <design-code>-<nn> 子需求标题（页面维度）`
- 元信息：`Parent: REQ-XXX`、`Task: <design-code>-<nn>`、`Design: <design-package>`、`File: <design-code>-<task-slug>-<nn>.md`
- `## 摘要`
- `## Resume Summary / 执行摘要`：引用 `../common/template-blocks.md#resume-summary`
- `## 页面范围`
- `## 页面业务逻辑`
- `## 页面状态与权限`
- `## 接口映射`
- `## Parallel Boundary / 并行执行边界`：引用 `../common/template-blocks.md#parallel-boundary`
- `## Change Boundary / 改动边界`：引用 `../common/template-blocks.md#change-boundary`
- `## 验收标准`

## 子任务关键表

```markdown
## 页面范围
- PageKey（仅 1 个）：
- 页面（仅 1 个）：
- 路由（仅 1 条主路由）：
- In Scope：
- Out of Scope：

## 接口映射
| 接口 | 方法 | 触发时机 | 入参要点 | 出参要点 | 错误处理 |
| --- | --- | --- | --- | --- | --- |
```
