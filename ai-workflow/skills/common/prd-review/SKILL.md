---
name: prd-review
description: 检查 PRD 是否结构化、功能点是否清晰且可实现；进入技术方案或代码实现前，输出问题清单、业务对照证据、历史问题复核和修订建议。
version: 1.1.0
owners:
  - dachui
  - sunwencong
---

# PRD 审查

## 目标

- 对 PRD 做可执行性审查，降低设计返工和实现歧义。
- 发现结构、功能点、业务规则、异常边界、权限、状态、数据口径和非功能要求中的缺口。
- 将问题转成可确认、可修订、可进入技术方案的审查结论。

## 何时使用

- 用户要求检查 PRD、评审需求文档或输出 PRD review。
- 需求准备进入技术方案或实现阶段。
- PRD 有较大更新，需要回归检查质量。

## 工作流

1. 采集 PRD 事实：
   - 通读 PRD，提取章节结构、功能点清单、关键实体、角色、状态、动作和约束词。
   - 标注每个功能点的需求描述、业务规则、异常边界是否齐全。
2. 下钻业务基线：
   - 读取 `ai-workflow/wiki/<project-domain>/business/` 相关具体文档至少 1 篇。
   - 读取 `ai-workflow/sdd/changes/` 同域历史 PRD/Design/Tasks 至少 1 份，若存在。
   - 若出现规则争议，再下钻 `ai-workflow/wiki/<project-domain>/rules/` 对应规则正文，若存在。
3. 联合历史 review：
   - 若同名 review 文档已存在，必须联合加载 `PRD + review`。
   - 历史问题继承、状态复核和人工确认结论保留规则按需读取 `references/history-inheritance.md`。
4. 执行审查：
   - 使用 `references/checklist.md` 逐项检查。
   - 输出“业务对照证据表”：`PRD 功能点 -> 对照文档 -> 结论 -> 审查建议`。
   - 按 `BLOCKER / MAJOR / MINOR / SUGGESTION` 记录问题。
5. 生成结果：
   - 每条问题必须包含 `问题`、`影响`、`建议`、`待确认问题`、`确认结论`。
   - `确认结论` 默认写 `待人工确认`；若历史 review 已有人工填写结论，按继承规则保留。
   - 输出功能点覆盖表，确保每个功能点都有 `通过/有问题` 结论。
   - 存在历史 review 时输出“历史问题复核结果”：`延续 / 已修复 / 已失效 / 新增`。
   - 输出格式按需读取 `references/output-template.md`。

## 硬门禁

- 禁止只看 `INDEX.md` 就输出审查完成结论；必须下钻具体业务或历史文档。
- 若目标已有 review 文档，禁止只看 PRD 或只看旧 review；必须联合审查。
- 所有保留问题必须回到当前 PRD 原文逐条核验，禁止原样继承旧问题。
- 若不存在可用业务基线文档，必须新增至少 1 条 `MAJOR`，说明“缺少业务对照基线”的影响和补齐动作。
- 每条 `BLOCKER/MAJOR` 必须能追溯到 PRD 原文与至少一份对照文档。
- 不改写 PRD 原文事实，不凭空补业务规则；缺失项标为待确认。

## 按需读取

- 审查维度：`references/checklist.md`。
- 历史问题继承和复核：`references/history-inheritance.md`。
- 输出结构：`references/output-template.md`。

## 自检

- 所有结论都有文档依据，问题建议可直接转为修订任务。
- 已输出业务对照证据表、功能点覆盖表、阻塞项优先级和下一步动作。
- 若 review 文档为增量更新，所有保留问题都已完成“旧结论 -> 当前原文”的逐条回刷。
- 不存在“PRD 已修复，但 review 仍保留旧问题”的过期结论。
- 已保留同一问题的历史人工 `确认结论`，若存在。
