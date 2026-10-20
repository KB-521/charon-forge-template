# 模板公共块

前端和后端模板引用本文件，避免重复展开通用表单。

## Resume Summary

必填字段：Goal、Current Status、Constraints、Progress、Key Decisions、Relevant Files、Commands Run、Verified、Open Questions、Next Steps、Blockers、Critical Context。

## Parallel Queue

父计划和父需求 `INDEX.md` 必须同步：并行组、状态、可并行任务、前置依赖、阻塞任务、建议 worktree、建议分支、写入范围、合并顺序、冲突预期、执行方式、备注。

## Parallel Boundary

子任务必须写：并行组、前置依赖、可并行任务、阻塞任务、启动条件、建议 worktree、建议分支、合并顺序、冲突预期。

## Change Boundary

子任务必须写：允许修改、禁止修改、共享契约。后端命中 SQL 时额外写 SQL Directory 和 SQL Order Range。

## Trace Matrix

父计划必须建立功能点追溯矩阵，至少包含：功能点、批次、Task Code、子任务文件、验收标准；前端额外包含 PageKey 和页面。
