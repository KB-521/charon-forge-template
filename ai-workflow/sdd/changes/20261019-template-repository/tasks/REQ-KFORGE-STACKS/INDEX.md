# REQ-KFORGE-STACKS 技术栈模板由用户后续维护

- 状态：Deferred；本次框架 0/0 已实现；实际模板 5 项 Deferred，未创建。
- 用户范围确认：只生成并执行框架，实际模板由用户后续写入/导入；已覆盖此前首批两模板假设。
- 输入：[实施技术方案](../../design/technical-solution.md)（DES-BE-20261019-002）。
- [父计划](REQ-KFORGE-STACKS-split-plan.md)

## 子任务清单

| Task Code | 子任务 | 状态 | 依赖 | 交付范围 |
| --- | --- | --- | --- | --- |
| KFORGE-16 | [Next.js 独立模板](KFORGE-nextjs-template-16.md) | Deferred | [KFORGE-15](../REQ-KFORGE-LAUNCH/KFORGE-cli-release-handoff-15.md) | 用户后续模板，不在本次范围 |
| KFORGE-17 | [NestJS 独立模板](KFORGE-nestjs-template-17.md) | Deferred | [KFORGE-15](../REQ-KFORGE-LAUNCH/KFORGE-cli-release-handoff-15.md) | 用户后续模板，不在本次范围 |
| KFORGE-18 | [Java Spring Boot 独立模板](KFORGE-java-spring-template-18.md) | Deferred | [KFORGE-15](../REQ-KFORGE-LAUNCH/KFORGE-cli-release-handoff-15.md) | 用户后续模板，不在本次范围 |
| KFORGE-19 | [Flutter 独立模板](KFORGE-flutter-app-template-19.md) | Deferred | [KFORGE-15](../REQ-KFORGE-LAUNCH/KFORGE-cli-release-handoff-15.md) | 用户后续模板，不在本次范围 |
| KFORGE-20 | [LangChain TS 独立模板](KFORGE-langchain-ts-template-20.md) | Deferred | [KFORGE-15](../REQ-KFORGE-LAUNCH/KFORGE-cli-release-handoff-15.md) | 用户后续模板，不在本次范围 |

## Parallel Queue / 并行执行队列

| 并行组 | 状态 | 可并行任务 | 前置依赖 | 阻塞任务 | 建议 worktree | 建议分支 | 写入范围 | 合并顺序 | 冲突预期 | 执行方式 | 备注 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| G16 | Blocked | 无 | [KFORGE-15](../REQ-KFORGE-LAUNCH/KFORGE-cli-release-handoff-15.md) | 用户后续模板导入 | task-kforge-16（未创建） | task/kforge-16（未创建） | 未来模板目录；未创建 | 16 | 04/05 共用 distribution.ts；03/06 共用 archive.ts，已串行 | 不执行 | 范围外 Deferred |
| G17 | Blocked | 无 | [KFORGE-15](../REQ-KFORGE-LAUNCH/KFORGE-cli-release-handoff-15.md) | 用户后续模板导入 | task-kforge-17（未创建） | task/kforge-17（未创建） | 未来模板目录；未创建 | 17 | 04/05 共用 distribution.ts；03/06 共用 archive.ts，已串行 | 不执行 | 范围外 Deferred |
| G18 | Blocked | 无 | [KFORGE-15](../REQ-KFORGE-LAUNCH/KFORGE-cli-release-handoff-15.md) | 用户后续模板导入 | task-kforge-18（未创建） | task/kforge-18（未创建） | 未来模板目录；未创建 | 18 | 04/05 共用 distribution.ts；03/06 共用 archive.ts，已串行 | 不执行 | 范围外 Deferred |
| G19 | Blocked | 无 | [KFORGE-15](../REQ-KFORGE-LAUNCH/KFORGE-cli-release-handoff-15.md) | 用户后续模板导入 | task-kforge-19（未创建） | task/kforge-19（未创建） | 未来模板目录；未创建 | 19 | 04/05 共用 distribution.ts；03/06 共用 archive.ts，已串行 | 不执行 | 范围外 Deferred |
| G20 | Blocked | 无 | [KFORGE-15](../REQ-KFORGE-LAUNCH/KFORGE-cli-release-handoff-15.md) | 用户后续模板导入 | task-kforge-20（未创建） | task/kforge-20（未创建） | 未来模板目录；未创建 | 20 | 04/05 共用 distribution.ts；03/06 共用 archive.ts，已串行 | 不执行 | 范围外 Deferred |

本次未启动 worker/worktree；框架实际串行实现。Implemented 表示代码与本机验证完成，不表示线上已发布或其它操作系统 runner 已通过。
