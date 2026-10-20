# REQ-KFORGE-FOUNDATION 工程、协议与确定性打包

- 状态：Implemented；本次框架 3/3 已实现；实际模板 0 项 Deferred，未创建。
- 用户范围确认：只生成并执行框架，实际模板由用户后续写入/导入；已覆盖此前首批两模板假设。
- 输入：[实施技术方案](../../design/technical-solution.md)（DES-BE-20261019-002）。
- [父计划](REQ-KFORGE-FOUNDATION-split-plan.md)

## 子任务清单

| Task Code | 子任务 | 状态 | 依赖 | 交付范围 |
| --- | --- | --- | --- | --- |
| KFORGE-01 | [唯一 CLI 工程与构建边界](KFORGE-toolchain-bootstrap-01.md) | Implemented | 无 | 框架实现/本机验证；无正式外发 |
| KFORGE-02 | [描述协议、数据类型与错误契约](KFORGE-protocol-contracts-02.md) | Implemented | [KFORGE-01](KFORGE-toolchain-bootstrap-01.md) | 框架实现/本机验证；无正式外发 |
| KFORGE-03 | [发布白名单与确定性模板归档](KFORGE-deterministic-pack-03.md) | Implemented | [KFORGE-01](KFORGE-toolchain-bootstrap-01.md)、[KFORGE-02](KFORGE-protocol-contracts-02.md) | 框架实现/本机验证；无正式外发 |

## Parallel Queue / 并行执行队列

| 并行组 | 状态 | 可并行任务 | 前置依赖 | 阻塞任务 | 建议 worktree | 建议分支 | 写入范围 | 合并顺序 | 冲突预期 | 执行方式 | 备注 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| G1 | Done | 无 | 无 | 无 | task-kforge-01（未创建） | task/kforge-01（未创建） | package.json, pnpm-lock.yaml, tsconfig.json, esbuild.config.mjs, .gitignore, .gitattributes, .prettierrc.json | 01 | 04/05 共用 distribution.ts；03/06 共用 archive.ts，已串行 | 已串行实现 | 本机验收；跨平台 CI 已配置但未运行 |
| G2 | Done | 无 | [KFORGE-01](KFORGE-toolchain-bootstrap-01.md) | 无 | task-kforge-02（未创建） | task/kforge-02（未创建） | schemas/, cli/src/core/protocol/, cli/src/core/errors.ts, scripts/generate-schemas.mjs | 02 | 04/05 共用 distribution.ts；03/06 共用 archive.ts，已串行 | 已串行实现 | 本机验收；跨平台 CI 已配置但未运行 |
| G3 | Done | 无 | [KFORGE-01](KFORGE-toolchain-bootstrap-01.md)、[KFORGE-02](KFORGE-protocol-contracts-02.md) | 无 | task-kforge-03（未创建） | task/kforge-03（未创建） | scripts/lib/template-pack.ts, scripts/validate-templates.ts, scripts/pack-templates.ts, cli/src/core/archive.ts | 03 | 04/05 共用 distribution.ts；03/06 共用 archive.ts，已串行 | 已串行实现 | 本机验收；跨平台 CI 已配置但未运行 |

本次未启动 worker/worktree；框架实际串行实现。Implemented 表示代码与本机验证完成，不表示线上已发布或其它操作系统 runner 已通过。
