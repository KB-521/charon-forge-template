# [REQ-KFORGE-STACKS] 实现拆分与交接计划

## 摘要

技术栈模板由用户后续维护。本次框架 0/0 已实现；实际模板 5 项 Deferred，未创建。 2026-10-19 用户纠正首批模板假设并授权框架执行；真实模板不再作为 CI、发布预览或框架验收前置。

## Resume Summary / 执行摘要

- Goal / 目标：技术栈模板由用户后续维护
- Current Status / 当前状态：Deferred
- Constraints / 关键约束：仅框架；真实模板由用户后续维护；无正式外发；单根包；模板开发在仓库外；LOCAL 不提交。
- Progress / 当前进展：本次框架 0/0 已实现；实际模板 5 项 Deferred，未创建。
- Key Decisions / 关键决策：用户已明确授权框架执行，取消首批实际模板前置；以临时 fixture 验收。
- Relevant Files / 相关文件：INDEX.md、../../design/technical-solution.md
- Commands Run / 已运行命令：仅文档修订，未执行模板构建。
- Verified / 已验证：本次没有实际模板；不声明原生技术栈验收。
- Open Questions / 待确认：真实模板内容/版本/优先级由用户后续决定；外发时再确定许可、包名与可信源。
- Next Steps / 下一步：用户可继续导入实际模板；如仅检查框架，使用根 README 命令。
- Blockers / 阻塞点：框架本机验收无阻塞；模板内容不在本次范围。
- Critical Context / 关键上下文：DES-BE-20261019-002，template-repository-implementation；template 任务 Deferred 不是框架缺陷。

## 输入文档

- [上游架构](../../design/architecture.md)：DES-BE-20261019-001，保留历史结构决策。
- [技术方案](../../design/technical-solution.md)：DES-BE-20261019-002，当前框架执行范围与实现接口。
- 最新用户指示：只生成框架，实际模板由用户后续慢慢写入或导入，立即执行框架任务。
- 原无 PRD、业务 wiki、数据库/API，未虚构应用事实。

## Complexity / 复杂度

- Score：8
- Level：L；总体 XL 已分四个父需求。
- Split Budget：4–6
- Actual Task Count：5（本次框架 0，Deferred 5）
- Why not more：按可独立验证模块交接；不把测试、文档或每个机械文件单独拆任务。
- Why not less：协议、网络完整性、解包/目录提交、维护入口与发行预览的失败出口不同；实际模板属于用户未来工作。

## 拆分策略

先工程/协议/打包，再生成引擎与维护工具，最后 fixture CI、catalog/CLI 发布预览及文档。实际顺序为串行；04/05 共用 distribution.ts，03/06 共用 archive.ts，不再标为可并行写入。保留 Deferred 文件名用于追溯，不移动到状态目录。

## Subtask Complexity Budget

| Task Code | Type | Complexity Drivers | Score | Decision |
| --- | --- | --- | --- | --- |
| KFORGE-16 | template-content | 原生模板开发 | 0 | Deferred：用户后续维护 |
| KFORGE-17 | template-content | 原生模板开发 | 0 | Deferred：用户后续维护 |
| KFORGE-18 | template-content | 原生模板开发 | 0 | Deferred：用户后续维护 |
| KFORGE-19 | template-content | 原生模板开发 | 0 | Deferred：用户后续维护 |
| KFORGE-20 | template-content | 原生模板开发 | 0 | Deferred：用户后续维护 |

## Why Not Split

05 的下载与校验成功缓存属于同一个“只交付可信归档”的原子能力；网络故障、摘要/缓存污染均已有测试。14 现已收敛为无线上写入的发行预览，完整 catalog 合并/校验是预览产物的一致性边界；历史冲突、同版本替换与推荐回退均有测试。真正线上发布事务留待模板/托管建立后接入，未伪报完成。

## Refinement Plan / 细化计划

- Executable Tasks：本次框架已执行完毕，无待启动 worker；实现任务已按真实接口更新 Full 交接。
- Deferred Tasks：11/12/16–20 由用户后续维护。何时细化：用户选定并导入具体模板、锁定 SDK/原生验收后再开始，不作为本次交付阻塞。
- 共享契约现在来自 schemas/*.schema.json 与生成类型；模块真实落点见子任务。

## 批次规划与依赖图

```mermaid
flowchart TD
  Scope[用户后续写入或导入实际模板]
```

## Parallel Queue / 并行执行队列

| 并行组 | 状态 | 可并行任务 | 前置依赖 | 阻塞任务 | 建议 worktree | 建议分支 | 写入范围 | 合并顺序 | 冲突预期 | 执行方式 | 备注 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| G16 | Blocked | 无 | [KFORGE-15](../REQ-KFORGE-LAUNCH/KFORGE-cli-release-handoff-15.md) | 用户后续模板导入 | task-kforge-16（未创建） | task/kforge-16（未创建） | 未来模板目录；未创建 | 16 | 04/05 共用 distribution.ts；03/06 共用 archive.ts，已串行 | 不执行 | 范围外 Deferred |
| G17 | Blocked | 无 | [KFORGE-15](../REQ-KFORGE-LAUNCH/KFORGE-cli-release-handoff-15.md) | 用户后续模板导入 | task-kforge-17（未创建） | task/kforge-17（未创建） | 未来模板目录；未创建 | 17 | 04/05 共用 distribution.ts；03/06 共用 archive.ts，已串行 | 不执行 | 范围外 Deferred |
| G18 | Blocked | 无 | [KFORGE-15](../REQ-KFORGE-LAUNCH/KFORGE-cli-release-handoff-15.md) | 用户后续模板导入 | task-kforge-18（未创建） | task/kforge-18（未创建） | 未来模板目录；未创建 | 18 | 04/05 共用 distribution.ts；03/06 共用 archive.ts，已串行 | 不执行 | 范围外 Deferred |
| G19 | Blocked | 无 | [KFORGE-15](../REQ-KFORGE-LAUNCH/KFORGE-cli-release-handoff-15.md) | 用户后续模板导入 | task-kforge-19（未创建） | task/kforge-19（未创建） | 未来模板目录；未创建 | 19 | 04/05 共用 distribution.ts；03/06 共用 archive.ts，已串行 | 不执行 | 范围外 Deferred |
| G20 | Blocked | 无 | [KFORGE-15](../REQ-KFORGE-LAUNCH/KFORGE-cli-release-handoff-15.md) | 用户后续模板导入 | task-kforge-20（未创建） | task/kforge-20（未创建） | 未来模板目录；未创建 | 20 | 04/05 共用 distribution.ts；03/06 共用 archive.ts，已串行 | 不执行 | 范围外 Deferred |

## 共享契约

- JSON Schema → schemas.generated.ts → FromSchema 类型，schema 是字段真源。
- RemoteStore 固定 Snapshot/PublishedVersion；stageProject 返回 Stage；commitProject 返回完整项目路径；安装仅在完整生成后发生。
- 根 package/锁管理工具依赖；真实模板的各语言锁文件独立。
- 有效空模板仓库、默认空目录、预览 workflow 无线上写权限是当前执行边界。

## SQL Namespace

N/A。SQL Directory / SQL Order Range 均 N/A；无数据库或持久化任务。

## Trace Matrix / 功能点追溯矩阵

| 功能点 | 批次 | Task Code | 子任务文件 | 验收标准 |
| --- | --- | --- | --- | --- |
| Next.js 常用栈扩展；实施方案 §10；architecture §4/8/10 | B4 | KFORGE-16 | [KFORGE-nextjs-template-16.md](KFORGE-nextjs-template-16.md) | 范围外；用户后续定义原生验收 |
| NestJS 常用栈扩展；实施方案 §10；architecture §4/8/10 | B4 | KFORGE-17 | [KFORGE-nestjs-template-17.md](KFORGE-nestjs-template-17.md) | 范围外；用户后续定义原生验收 |
| Java 原生工具链、Wrapper、固定应用标识与手动指引；实施方案 §4/8/10；architecture §5/8/10 | B4 | KFORGE-18 | [KFORGE-java-spring-template-18.md](KFORGE-java-spring-template-18.md) | 范围外；用户后续定义原生验收 |
| Flutter 原生工具链、平台矩阵与缓存隔离；实施方案 §4/8/10；architecture §5/8/10 | B4 | KFORGE-19 | [KFORGE-flutter-app-template-19.md](KFORGE-flutter-app-template-19.md) | 范围外；用户后续定义原生验收 |
| LangChain TS 常用栈扩展与无账号验证；实施方案 §10；architecture §5/7/8/10 | B4 | KFORGE-20 | [KFORGE-langchain-ts-template-20.md](KFORGE-langchain-ts-template-20.md) | 范围外；用户后续定义原生验收 |

## 发布与质量门禁

- typecheck/build/框架测试/实际 tarball 安装为本次本机验收；CI 配置 Node 22/24 × 三平台，但没有声称远端 runner 已运行。
- tests 只生成临时无技术栈 fixture；templates 当前仅 README，未创建业务应用模板。
- 发布前必须有真实模板验证、许可与托管配置；当前 workflows 只上传预览，无 npm publish、Release 或 Pages 部署。

## 风险与待确认

实际应用 SDK/平台构建、公开源连通和线上发布属于用户后续工作。当前 UNLICENSED，分发源 null；这些不阻塞框架本地使用或导入维护。

## 文档验证记录

Node 22.23.2 / pnpm 10.18.3；typecheck、build、13 项框架测试通过；空模板校验/打包/catalog dry-run 与实际 npm tarball 仓库外安装通过。 代码检查与新文档链接/任务状态同步检查见本次执行证据。没有提交用户工作区或发布外部产物。
