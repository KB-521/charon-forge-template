# KFORGE-19 Flutter 独立模板

Parent: REQ-KFORGE-STACKS
Task: KFORGE-19
Design: template-repository-implementation
File: KFORGE-flutter-app-template-19.md

- 方案索引ID：DES-BE-20261019-002；[实施技术方案](../../design/technical-solution.md)。
- 状态：Deferred；最新用户指示覆盖原“首批两模板”草案。

## 摘要

用户后续逐步维护本技术栈模板，本次仅保留范围与追溯。

## Resume Summary / 执行摘要

- Goal / 目标：用户后续逐步维护本技术栈模板，本次仅保留范围与追溯。
- Current Status / 当前状态：Deferred
- Constraints / 关键约束：仅框架；真实模板由用户后续维护；无正式外发；单根包；模板开发在仓库外；LOCAL 不提交。
- Progress / 当前进展：用户后续工作；本次未创建实际模板。
- Key Decisions / 关键决策：用户已明确授权框架执行，取消首批实际模板前置；以临时 fixture 验收。
- Relevant Files / 相关文件：templates/mobile/flutter/
- Commands Run / 已运行命令：仅文档修订，未执行模板构建。
- Verified / 已验证：本次没有实际模板；不声明原生技术栈验收。
- Open Questions / 待确认：真实模板内容/版本/优先级由用户后续决定；外发时再确定许可、包名与可信源。
- Next Steps / 下一步：用户提供实际模板后细化。
- Blockers / 阻塞点：用户后续提供模板；非当前阻塞。
- Critical Context / 关键上下文：DES-BE-20261019-002，template-repository-implementation；template 任务 Deferred 不是框架缺陷。

## Task Type

- Type：template-content
- Recommended Skill：req-dev、Code；仓库无 CLI 专用实现 skill，未套用 Java 或前端页面实现流程。
- Required Contracts：实施方案 §3/4/9，schemas/ 与实际模块导出。
- Handoff Output：未来模板与原生验收证据；本次不产出。
- Refinement Level：Outline

## Subtask Complexity

- Drivers：原生模板开发
- Score：0
- Decision：Deferred
- Why not split：模板未提供，暂不推测内部细分。
- Validation for each driver：原生验证由未来模板定义。

## 范围

用户后续逐步维护本技术栈模板，本次仅保留范围与追溯。

## 验收标准

- [ ] 未来模板可在仓库外独立安装、构建、测试；由用户后续补齐。
- [ ] 有实际工程后才锁定 SDK/平台与版本，不视为框架前置。
- [ ] 发布前检查污染/锁文件/README 与版本。

## 模块落点

- `templates/mobile/flutter/`（未来目录，未创建）

## 任务执行方案

何时细化：用户明确选定并导入该实际模板时，读取实际原生工程、锁定 SDK、补充安装/构建/测试与平台矩阵，再创建实现步骤。当前不创建模板目录。

## 接口入参/出参明细

不适用：用户未来模板尚未提供。

## 设计字段明细

尚无实际模板字段，后续以 template.json schema 校验。

## 验证方案

本次未执行此技术栈原生测试。 真实 npm 包检查验证仓库外安装、bin、版本、帮助及空列表；远程生成通过注入 HTTP fixture 的同一 CLI 路径验证。

## 依赖

- 前置：[KFORGE-15](../REQ-KFORGE-LAUNCH/KFORGE-cli-release-handoff-15.md)。
- 本次已取消作为框架前置；用户选择模板后再规划排期。

## Parallel Boundary / 并行执行边界

- 并行组：G19。
- 前置依赖：[KFORGE-15](../REQ-KFORGE-LAUNCH/KFORGE-cli-release-handoff-15.md)。
- 可并行任务：无，本次串行。
- 阻塞任务：不阻塞框架交付。
- 启动条件：用户后续明确选定模板与原生工程。
- 建议 worktree：task-kforge-19（未创建）。
- 建议分支：task/kforge-19（未创建）。
- 合并顺序：19；跨父依赖优先。
- 冲突预期：04/05 共写 distribution.ts，03/06 共写 archive.ts；已经串行，不标为可并行写入。

## Change Boundary / 改动边界

- 允许修改：templates/mobile/flutter/。
- 禁止修改：其它任务/模板、LOCAL、用户无关变更、真实外部发布状态。
- 共享契约：schema 真源、根工具锁文件、固定安装/来源和不覆盖规则。
- SQL Directory：N/A；SQL Order Range：N/A。

## 交付定义（DoD）

- [ ] 实际模板与独立原生证据由后续任务提供。
- [ ] 保留 Deferred，不移动或假报完成。
