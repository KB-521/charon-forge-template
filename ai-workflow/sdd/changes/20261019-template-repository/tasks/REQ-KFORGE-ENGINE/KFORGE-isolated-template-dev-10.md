# KFORGE-10 模板导入与仓库外开发入口

Parent: REQ-KFORGE-ENGINE
Task: KFORGE-10
Design: template-repository-implementation
File: KFORGE-isolated-template-dev-10.md

- 方案索引ID：DES-BE-20261019-002；[实施技术方案](../../design/technical-solution.md)。
- 状态：Implemented；最新用户指示覆盖原“首批两模板”草案。

## 摘要

导入已有原生工程时排除运行/本地资产且不覆盖；本地已跟踪模板经同一打包/生成核心输出到仓库外新工程，不自动安装、启动、回写或 git add。

## Resume Summary / 执行摘要

- Goal / 目标：导入已有原生工程时排除运行/本地资产且不覆盖；本地已跟踪模板经同一打包/生成核心输出到仓库外新工程，不自动安装、启动、回写或 git add。
- Current Status / 当前状态：Implemented
- Constraints / 关键约束：仅框架；真实模板由用户后续维护；无正式外发；单根包；模板开发在仓库外；LOCAL 不提交。
- Progress / 当前进展：模块、fixture 验证与交接文档已落盘；未正式发布。
- Key Decisions / 关键决策：用户已明确授权框架执行，取消首批实际模板前置；以临时 fixture 验收。
- Relevant Files / 相关文件：scripts/import-template.ts, scripts/prepare-template-dev.ts, docs/template-development.md
- Commands Run / 已运行命令：Node 22.23.2 / pnpm 10.18.3；typecheck、build、13 项框架测试通过；空模板校验/打包/catalog dry-run 与实际 npm tarball 仓库外安装通过。
- Verified / 已验证：Node 22.23.2 / pnpm 10.18.3；typecheck、build、13 项框架测试通过；空模板校验/打包/catalog dry-run 与实际 npm tarball 仓库外安装通过。
- Open Questions / 待确认：真实模板内容/版本/优先级由用户后续决定；外发时再确定许可、包名与可信源。
- Next Steps / 下一步：可本地使用框架；导入模板后继续原生验收。
- Blockers / 阻塞点：本次框架无阻塞；三平台 CI 还需远端实际运行。
- Critical Context / 关键上下文：DES-BE-20261019-002，template-repository-implementation；template 任务 Deferred 不是框架缺陷。

## Task Type

- Type：maintenance-tool
- Recommended Skill：req-dev、Code；仓库无 CLI 专用实现 skill，未套用 Java 或前端页面实现流程。
- Required Contracts：实施方案 §3/4/9，schemas/ 与实际模块导出。
- Handoff Output：真实模块、框架测试与文档；发布任务仅预览。
- Refinement Level：Full

## Subtask Complexity

- Drivers：导入/目录边界安全
- Score：1
- Decision：Keep
- Why not split：只交付本模块的一致性出口；05 的网络/校验缓存不可交付半成品，14 只准备一致预览而不执行线上事务。
- Validation for each driver：网络/离线/损坏摘要、归档/目录边界、安装故障、历史冲突/推荐回退已在框架测试覆盖；具体适用场景见 tests/。

## 范围

导入已有原生工程时排除运行/本地资产且不覆盖；本地已跟踪模板经同一打包/生成核心输出到仓库外新工程，不自动安装、启动、回写或 git add。

## 验收标准

- [x] 模块已实现，typecheck/build 与适用框架测试通过。
- [x] 空模板目录有效；无实际技术栈模板进入交付。
- [x] 改动范围与任务状态已同步；未提交工作区或正式外发。

## 模块落点

- `scripts/import-template.ts`
- `scripts/prepare-template-dev.ts`
- `docs/template-development.md`

## 任务执行方案

实现已落盘：先按设计冻结协议与错误，再以测试 fixture 验证本模块正负例，最后纳入 build/typecheck 和真实 CLI 包检查；当前代码是交接事实，不再保留不存在的计划目录。

## 接口入参/出参明细

输入/输出以 [实施技术方案](../../design/technical-solution.md) §3–9 和下面真实模块导出为准；公开 CLI 为 runCLI(argv, version, config, network?)，维护命令通过 Commander 接受固定参数。

## 设计字段明细

Template/Catalog/Channel/GenerationRecord 从 schemas 派生；模块输入输出与错误语义见技术方案，不重复手写字段副本。

## 验证方案

Node 22.23.2 / pnpm 10.18.3；typecheck、build、13 项框架测试通过；空模板校验/打包/catalog dry-run 与实际 npm tarball 仓库外安装通过。 真实 npm 包检查验证仓库外安装、bin、版本、帮助及空列表；远程生成通过注入 HTTP fixture 的同一 CLI 路径验证。

## 依赖

- 前置：[KFORGE-03](../REQ-KFORGE-FOUNDATION/KFORGE-deterministic-pack-03.md)、[KFORGE-06](KFORGE-safe-render-stage-06.md)、[KFORGE-07](KFORGE-exclusive-project-commit-07.md)。
- 前置框架能力已实现并本机验证；11/12 的实际模板不再阻塞 13。

## Parallel Boundary / 并行执行边界

- 并行组：G10。
- 前置依赖：[KFORGE-03](../REQ-KFORGE-FOUNDATION/KFORGE-deterministic-pack-03.md)、[KFORGE-06](KFORGE-safe-render-stage-06.md)、[KFORGE-07](KFORGE-exclusive-project-commit-07.md)。
- 可并行任务：无，本次串行。
- 阻塞任务：无当前框架阻塞。
- 启动条件：已获用户框架执行授权，已串行完成。
- 建议 worktree：task-kforge-10（未创建）。
- 建议分支：task/kforge-10（未创建）。
- 合并顺序：10；跨父依赖优先。
- 冲突预期：04/05 共写 distribution.ts，03/06 共写 archive.ts；已经串行，不标为可并行写入。

## Change Boundary / 改动边界

- 允许修改：scripts/import-template.ts; scripts/prepare-template-dev.ts; docs/template-development.md。
- 禁止修改：其它任务/模板、LOCAL、用户无关变更、真实外部发布状态。
- 共享契约：schema 真源、根工具锁文件、固定安装/来源和不覆盖规则。
- SQL Directory：N/A；SQL Order Range：N/A。

## 交付定义（DoD）

- [x] 当前框架范围已实现并通过本机验证，执行摘要可恢复。
- [x] 实际代码路径与父索引同步；线上发行/跨平台 runner 未伪报通过。
