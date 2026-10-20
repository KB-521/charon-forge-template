# 实施任务父需求索引

- Change：20261019-template-repository；Design：template-repository-implementation / DES-BE-20261019-002。
- 用户已明确：本次只生成并执行框架，实际模板后续由用户逐步写入或导入。
- 原 20 项任务保留追溯：13 项框架 Implemented，7 项实际模板 Deferred；当前范围 13/13 已实现并本机验收。
- 本索引仅登记父需求，子任务状态/依赖/写入边界见各父 INDEX。

| 父需求 | 父需求索引 | 拆分计划 | 状态 | 范围 | 进度摘要 |
| --- | --- | --- | --- | --- | --- |
| REQ-KFORGE-FOUNDATION | [工程、协议与确定性打包](REQ-KFORGE-FOUNDATION/INDEX.md) | [拆分计划](REQ-KFORGE-FOUNDATION/REQ-KFORGE-FOUNDATION-split-plan.md) | Implemented | 框架及发布预览 | 3/3 框架；0 模板 Deferred |
| REQ-KFORGE-ENGINE | [CLI 生成引擎与独立开发入口](REQ-KFORGE-ENGINE/INDEX.md) | [拆分计划](REQ-KFORGE-ENGINE/REQ-KFORGE-ENGINE-split-plan.md) | Implemented | 框架及发布预览 | 7/7 框架；0 模板 Deferred |
| REQ-KFORGE-LAUNCH | [框架 CI、发布预览与文档](REQ-KFORGE-LAUNCH/INDEX.md) | [拆分计划](REQ-KFORGE-LAUNCH/REQ-KFORGE-LAUNCH-split-plan.md) | Implemented | 框架及发布预览 | 3/3 框架；2 模板 Deferred |
| REQ-KFORGE-STACKS | [五种常用技术栈扩展](REQ-KFORGE-STACKS/INDEX.md) | [拆分计划](REQ-KFORGE-STACKS/REQ-KFORGE-STACKS-split-plan.md) | Deferred | 用户后续模板 | 0/0 框架；5 模板 Deferred |

验证记录见 [技术方案](../design/technical-solution.md) §14。没有实际模板、worker、分支、Git 提交或线上发布被创建。
