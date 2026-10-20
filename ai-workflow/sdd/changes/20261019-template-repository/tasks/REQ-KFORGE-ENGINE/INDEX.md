# REQ-KFORGE-ENGINE CLI 生成引擎与独立开发入口

- 状态：Implemented；本次框架 7/7 已实现；实际模板 0 项 Deferred，未创建。
- 用户范围确认：只生成并执行框架，实际模板由用户后续写入/导入；已覆盖此前首批两模板假设。
- 输入：[实施技术方案](../../design/technical-solution.md)（DES-BE-20261019-002）。
- [父计划](REQ-KFORGE-ENGINE-split-plan.md)

## 子任务清单

| Task Code | 子任务 | 状态 | 依赖 | 交付范围 |
| --- | --- | --- | --- | --- |
| KFORGE-04 | [catalog 获取与兼容版本解析](KFORGE-catalog-resolution-04.md) | Implemented | [KFORGE-02](../REQ-KFORGE-FOUNDATION/KFORGE-protocol-contracts-02.md) | 框架实现/本机验证；无正式外发 |
| KFORGE-05 | [下载完整性与内容缓存](KFORGE-verified-download-05.md) | Implemented | [KFORGE-02](../REQ-KFORGE-FOUNDATION/KFORGE-protocol-contracts-02.md) | 框架实现/本机验证；无正式外发 |
| KFORGE-06 | [安全解包与显式 token 渲染](KFORGE-safe-render-stage-06.md) | Implemented | [KFORGE-03](../REQ-KFORGE-FOUNDATION/KFORGE-deterministic-pack-03.md)、[KFORGE-05](KFORGE-verified-download-05.md) | 框架实现/本机验证；无正式外发 |
| KFORGE-07 | [目标独占创建与失败归属清理](KFORGE-exclusive-project-commit-07.md) | Implemented | [KFORGE-06](KFORGE-safe-render-stage-06.md) | 框架实现/本机验证；无正式外发 |
| KFORGE-08 | [固定安装适配器与平台执行](KFORGE-native-install-adapters-08.md) | Implemented | [KFORGE-02](../REQ-KFORGE-FOUNDATION/KFORGE-protocol-contracts-02.md) | 框架实现/本机验证；无正式外发 |
| KFORGE-09 | [CLI 参数、交互与生成编排](KFORGE-cli-create-command-09.md) | Implemented | [KFORGE-04](KFORGE-catalog-resolution-04.md)、[KFORGE-05](KFORGE-verified-download-05.md)、[KFORGE-06](KFORGE-safe-render-stage-06.md)、[KFORGE-07](KFORGE-exclusive-project-commit-07.md)、[KFORGE-08](KFORGE-native-install-adapters-08.md) | 框架实现/本机验证；无正式外发 |
| KFORGE-10 | [模板导入与仓库外开发入口](KFORGE-isolated-template-dev-10.md) | Implemented | [KFORGE-03](../REQ-KFORGE-FOUNDATION/KFORGE-deterministic-pack-03.md)、[KFORGE-06](KFORGE-safe-render-stage-06.md)、[KFORGE-07](KFORGE-exclusive-project-commit-07.md) | 框架实现/本机验证；无正式外发 |

## Parallel Queue / 并行执行队列

| 并行组 | 状态 | 可并行任务 | 前置依赖 | 阻塞任务 | 建议 worktree | 建议分支 | 写入范围 | 合并顺序 | 冲突预期 | 执行方式 | 备注 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| G4 | Done | 无 | [KFORGE-02](../REQ-KFORGE-FOUNDATION/KFORGE-protocol-contracts-02.md) | 无 | task-kforge-04（未创建） | task/kforge-04（未创建） | cli/src/core/distribution.ts | 04 | 04/05 共用 distribution.ts；03/06 共用 archive.ts，已串行 | 已串行实现 | 本机验收；跨平台 CI 已配置但未运行 |
| G5 | Done | 无 | [KFORGE-02](../REQ-KFORGE-FOUNDATION/KFORGE-protocol-contracts-02.md) | 无 | task-kforge-05（未创建） | task/kforge-05（未创建） | cli/src/core/distribution.ts | 05 | 04/05 共用 distribution.ts；03/06 共用 archive.ts，已串行 | 已串行实现 | 本机验收；跨平台 CI 已配置但未运行 |
| G6 | Done | 无 | [KFORGE-03](../REQ-KFORGE-FOUNDATION/KFORGE-deterministic-pack-03.md)、[KFORGE-05](KFORGE-verified-download-05.md) | 无 | task-kforge-06（未创建） | task/kforge-06（未创建） | cli/src/core/archive.ts | 06 | 04/05 共用 distribution.ts；03/06 共用 archive.ts，已串行 | 已串行实现 | 本机验收；跨平台 CI 已配置但未运行 |
| G7 | Done | 无 | [KFORGE-06](KFORGE-safe-render-stage-06.md) | 无 | task-kforge-07（未创建） | task/kforge-07（未创建） | cli/src/core/commit.ts | 07 | 04/05 共用 distribution.ts；03/06 共用 archive.ts，已串行 | 已串行实现 | 本机验收；跨平台 CI 已配置但未运行 |
| G8 | Done | 无 | [KFORGE-02](../REQ-KFORGE-FOUNDATION/KFORGE-protocol-contracts-02.md) | 无 | task-kforge-08（未创建） | task/kforge-08（未创建） | cli/src/core/install.ts | 08 | 04/05 共用 distribution.ts；03/06 共用 archive.ts，已串行 | 已串行实现 | 本机验收；跨平台 CI 已配置但未运行 |
| G9 | Done | 无 | [KFORGE-04](KFORGE-catalog-resolution-04.md)、[KFORGE-05](KFORGE-verified-download-05.md)、[KFORGE-06](KFORGE-safe-render-stage-06.md)、[KFORGE-07](KFORGE-exclusive-project-commit-07.md)、[KFORGE-08](KFORGE-native-install-adapters-08.md) | 无 | task-kforge-09（未创建） | task/kforge-09（未创建） | cli/src/index.ts, cli/src/commands/create.ts | 09 | 04/05 共用 distribution.ts；03/06 共用 archive.ts，已串行 | 已串行实现 | 本机验收；跨平台 CI 已配置但未运行 |
| G10 | Done | 无 | [KFORGE-03](../REQ-KFORGE-FOUNDATION/KFORGE-deterministic-pack-03.md)、[KFORGE-06](KFORGE-safe-render-stage-06.md)、[KFORGE-07](KFORGE-exclusive-project-commit-07.md) | 无 | task-kforge-10（未创建） | task/kforge-10（未创建） | scripts/import-template.ts, scripts/prepare-template-dev.ts, docs/template-development.md | 10 | 04/05 共用 distribution.ts；03/06 共用 archive.ts，已串行 | 已串行实现 | 本机验收；跨平台 CI 已配置但未运行 |

本次未启动 worker/worktree；框架实际串行实现。Implemented 表示代码与本机验证完成，不表示线上已发布或其它操作系统 runner 已通过。
