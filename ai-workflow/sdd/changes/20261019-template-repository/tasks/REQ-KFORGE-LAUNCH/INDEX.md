# REQ-KFORGE-LAUNCH 框架 CI、发布预览与文档交付（实际首批模板延期）

- 状态：Implemented；本次框架 3/3 已实现；实际模板 2 项 Deferred，未创建。
- 用户范围确认：只生成并执行框架，实际模板由用户后续写入/导入；已覆盖此前首批两模板假设。
- 输入：[实施技术方案](../../design/technical-solution.md)（DES-BE-20261019-002）。
- [父计划](REQ-KFORGE-LAUNCH-split-plan.md)

## 子任务清单

| Task Code | 子任务 | 状态 | 依赖 | 交付范围 |
| --- | --- | --- | --- | --- |
| KFORGE-11 | [React/Vite 首批模板](KFORGE-react-vite-template-11.md) | Deferred | [KFORGE-03](../REQ-KFORGE-FOUNDATION/KFORGE-deterministic-pack-03.md)、[KFORGE-09](../REQ-KFORGE-ENGINE/KFORGE-cli-create-command-09.md)、[KFORGE-10](../REQ-KFORGE-ENGINE/KFORGE-isolated-template-dev-10.md) | 用户后续模板，不在本次范围 |
| KFORGE-12 | [LangChain Python 首批模板](KFORGE-langchain-python-template-12.md) | Deferred | [KFORGE-03](../REQ-KFORGE-FOUNDATION/KFORGE-deterministic-pack-03.md)、[KFORGE-09](../REQ-KFORGE-ENGINE/KFORGE-cli-create-command-09.md)、[KFORGE-10](../REQ-KFORGE-ENGINE/KFORGE-isolated-template-dev-10.md) | 用户后续模板，不在本次范围 |
| KFORGE-13 | [隔离质量矩阵与分发闭环](KFORGE-validation-pipeline-13.md) | Implemented | [KFORGE-09](../REQ-KFORGE-ENGINE/KFORGE-cli-create-command-09.md)、[KFORGE-10](../REQ-KFORGE-ENGINE/KFORGE-isolated-template-dev-10.md) | 框架实现/本机验证；无正式外发 |
| KFORGE-14 | [完整历史 catalog 与模板发布预览](KFORGE-template-release-pipeline-14.md) | Implemented | [KFORGE-13](KFORGE-validation-pipeline-13.md) | 框架实现/本机验证；无正式外发 |
| KFORGE-15 | [CLI 包预览与维护文档交付](KFORGE-cli-release-handoff-15.md) | Implemented | [KFORGE-14](KFORGE-template-release-pipeline-14.md) | 框架实现/本机验证；无正式外发 |

## Parallel Queue / 并行执行队列

| 并行组 | 状态 | 可并行任务 | 前置依赖 | 阻塞任务 | 建议 worktree | 建议分支 | 写入范围 | 合并顺序 | 冲突预期 | 执行方式 | 备注 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| G11 | Blocked | 无 | [KFORGE-03](../REQ-KFORGE-FOUNDATION/KFORGE-deterministic-pack-03.md)、[KFORGE-09](../REQ-KFORGE-ENGINE/KFORGE-cli-create-command-09.md)、[KFORGE-10](../REQ-KFORGE-ENGINE/KFORGE-isolated-template-dev-10.md) | 用户后续模板导入 | task-kforge-11（未创建） | task/kforge-11（未创建） | 未来模板目录；未创建 | 11 | 04/05 共用 distribution.ts；03/06 共用 archive.ts，已串行 | 不执行 | 范围外 Deferred |
| G12 | Blocked | 无 | [KFORGE-03](../REQ-KFORGE-FOUNDATION/KFORGE-deterministic-pack-03.md)、[KFORGE-09](../REQ-KFORGE-ENGINE/KFORGE-cli-create-command-09.md)、[KFORGE-10](../REQ-KFORGE-ENGINE/KFORGE-isolated-template-dev-10.md) | 用户后续模板导入 | task-kforge-12（未创建） | task/kforge-12（未创建） | 未来模板目录；未创建 | 12 | 04/05 共用 distribution.ts；03/06 共用 archive.ts，已串行 | 不执行 | 范围外 Deferred |
| G13 | Done | 无 | [KFORGE-09](../REQ-KFORGE-ENGINE/KFORGE-cli-create-command-09.md)、[KFORGE-10](../REQ-KFORGE-ENGINE/KFORGE-isolated-template-dev-10.md) | 无 | task-kforge-13（未创建） | task/kforge-13（未创建） | .github/workflows/validate.yml, scripts/verify-templates.ts, scripts/verify-distribution.ts, tests/ | 13 | 04/05 共用 distribution.ts；03/06 共用 archive.ts，已串行 | 已串行实现 | 本机验收；跨平台 CI 已配置但未运行 |
| G14 | Done | 无 | [KFORGE-13](KFORGE-validation-pipeline-13.md) | 无 | task-kforge-14（未创建） | task/kforge-14（未创建） | scripts/lib/catalog.ts, scripts/build-catalog.ts, scripts/prepare-release.ts, scripts/fetch-release-history.mjs, scripts/run-release-prepare.mjs, .github/workflows/release-templates.yml | 14 | 04/05 共用 distribution.ts；03/06 共用 archive.ts，已串行 | 已串行实现 | 本机验收；跨平台 CI 已配置但未运行 |
| G15 | Done | 无 | [KFORGE-14](KFORGE-template-release-pipeline-14.md) | 无 | task-kforge-15（未创建） | task/kforge-15（未创建） | .github/workflows/release-cli.yml, docs/, README.md, AGENTS.md | 15 | 04/05 共用 distribution.ts；03/06 共用 archive.ts，已串行 | 已串行实现 | 本机验收；跨平台 CI 已配置但未运行 |

本次未启动 worker/worktree；框架实际串行实现。Implemented 表示代码与本机验证完成，不表示线上已发布或其它操作系统 runner 已通过。
