---
name: code-review
description: 评审后端代码质量、缺陷、安全风险与接口文档漂移；用于按需执行的提交前 review、PR 评审与问题定位。
version: 1.3.0
owners:
  - sunwencong
---

# 后端代码评审

## 目标

- 评审后端代码的安全性、正确性、稳定性和可维护性。
- 检查接口契约、日志规范、注释文档和测试资产是否与代码事实一致。
- 输出按严重级别排序的问题清单，而不是泛泛总结。

## 何时使用

- 提交前自检。
- PR review。
- 缺陷定位或回归后复核。
- `server/persistence-impl`、`server/req-impl` 或 `server/entry-impl` 结束后，用户明确要求做 code review。

## 评审顺序

1. 安全与数据风险。
2. 功能正确性与边界条件。
3. 事务、一致性与并发。
4. DAO / MyBatis / SQL。
5. 稳定性与可观测性。
6. 注释与文档同步。
7. 测试资产完整性。

## 评审流程

1. 明确需求、设计、影响范围和被评审模块。
2. 先看架构与主数据流：`Entry(Endpoint/Controller/Worker/MQ/Event) -> Service/Facade -> Persistence(Manager/DAO/Mapper)`。
3. 再看参数校验、异常处理、事务、SQL、日志和边界条件。
4. 核对代码与 `*-api-contract.md`、Endpoint/DTO/VO 源码证据，以及必要的 `server/AGENTS.md` 模块导航是否一致。
5. 使用 `references/checklist.md` 做逐项检查。
6. 输出评审结论；若需要固定格式，读取 `references/output-template.md`。
7. 默认不自动执行测试；若要执行，必须由用户显式要求。

## 硬门禁

- 只评论可验证事实，避免纯风格争论。
- 每条问题都要写清风险、影响范围和最小修复建议。
- 优先指出阻塞性问题、行为缺陷、安全风险和数据风险。
- 信息不足时明确标注待确认，不武断下结论。
- 禁止顺手扩大改动或要求无关重构。
- 未得到用户明确要求时，不自动运行测试、code review 之外的生成任务或覆盖率统计。

## 按需读取

- 评审规则入口：`references/rules/INDEX.md`。
- 详细检查清单：`references/checklist.md`。
- 输出模板：`references/output-template.md`。
