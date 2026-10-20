# 后端拆分门禁

## 适用场景

- 后端父计划和子任务文档完成前做最终自检。
- 需要防止固定粒度、遗漏功能点、缺少依赖、缺少并行边界或文档不可恢复。

## Gate

- Gate 1：未建立“功能点 -> 子需求”追溯矩阵，禁止结束。
- Gate 2：子需求缺少验收标准，禁止结束。
- Gate 3：根 `tasks/INDEX.md` 或父需求 `INDEX.md` 未更新，禁止结束。
- Gate 4：存在超出 Split Budget 的过大任务，且未解释原因，禁止结束。
- Gate 5：子任务未标注模块落点、Task Type 与推荐 skill，禁止结束。
- Gate 6：迁移/外部集成/发布门禁未单列或未说明，禁止结束。
- Gate 7：Executable Task 缺少“任务执行方案”，禁止结束。
- Gate 8：Executable Task 未给出“接口入参/出参明细”与“设计字段明细”，禁止结束。
- Gate 9：若存在表结构输入且未生成或解释 `persistence-capability`，禁止结束。
- Gate 10：若不存在表结构输入，禁止强制要求持久化首任务。
- Gate 11：同一父需求文档未落在 `tasks/REQ-XXX/`，禁止结束。
- Gate 12：父计划或父需求 `INDEX.md` 缺少并行执行队列，禁止结束。
- Gate 13：子任务缺少“并行执行边界”或“改动边界”，禁止结束。
- Gate 14：并行执行队列缺少 `建议 worktree`、`建议分支`、`写入范围`、`合并顺序` 或 `冲突预期`，禁止结束。
- Gate 15：子任务的并行执行边界缺少 `建议 worktree`、`建议分支`、`合并顺序` 或 `冲突预期`，禁止结束。
- Gate 16：父计划或任一子任务缺少 `Resume Summary / 执行摘要`，或该区块缺少当前状态、当前进展、已验证、下一步、阻塞点，禁止结束。
- Gate 17：未写 Complexity、Split Budget、Actual Task Count、Why not more、Why not less，禁止结束。
- Gate 18：Deferred Task 未写何时细化、依赖和验收出口，禁止结束。
- Gate 19：未读取 `../common/INDEX.md` 或缺少通用目录/并行/摘要规则，禁止结束。
- Gate 20：命中 SQL 变更但父计划未分配 `SQL Namespace`、`SQL Directory` 或 `SQL Order Range`，或子任务 SQL 写入边界缺失，禁止结束。
- Gate 21：父计划缺少 `Subtask Complexity Budget`，禁止结束。
- Gate 22：子任务 `Subtask Complexity >= 2` 但未拆分、未写 `Why not split`，或验证方案未覆盖每个复杂驱动，禁止结束。
- Gate 23：`business-service` 同时包含外部适配、异步 worker、迁移回滚、独立跨租户能力、多入口 API 中任意 2 项，且未拆分或未说明不可拆原因，禁止结束。

## 自检清单

- [ ] 任务数量来自复杂度预算，不来自固定下限。
- [ ] 每个任务有独立验收出口。
- [ ] 每个子任务已计算 Subtask Complexity。
- [ ] Executable Tasks 不超过最近 1~3 个。
- [ ] Deferred Tasks 不携带未稳定契约的伪细节。
- [ ] 业务、持久化、入口、异步、外部、迁移、测试文档的职责没有混乱。
- [ ] 并行队列能直接支撑 worktree + Codex 执行。
- [ ] 所有功能点可追溯到需求或设计来源。
