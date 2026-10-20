# 设计索引

| 方案索引ID | 名称 | 文档 | 状态 |
| --- | --- | --- | --- |
| DES-BE-20261019-001 | 多技术栈模板仓库结构与 CLI 分发架构 | [architecture.md](architecture.md) | 历史结构基线；实际模板范围按 002 和用户最新指示收敛 |
| DES-BE-20261019-002 | CLI 框架技术方案、真实模块与任务交接 | [technical-solution.md](technical-solution.md) | 用户授权框架执行；13 项框架 Implemented，7 项实际模板 Deferred；本机验收通过 |

DES-BE 沿用 Agent 编号规则，不表示模板只支持后端。设计包为 template-repository-implementation，短码 KFORGE。

2026-10-19 结构修订：外层单 CLI 包，核心为内部模块；内层 monorepo 仅有真实需求时新增。独立开发工程与基础源码分离，发布文件清单防污染。

2026-10-19 执行范围纠正：用户明确只要框架，实际模板后续逐步写入或导入；撤销首批 React/Python 前置，不创建实际技术栈源码。框架实现与验证见 002，对应 [任务索引](../tasks/INDEX.md)。正式发布不在本次范围，workflow 仅准备预览。
