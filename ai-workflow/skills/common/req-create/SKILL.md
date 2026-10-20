---
name: req-create
description: 从用户想法创建结构化需求文档。用于记录需要写入当前变更包任务索引的新功能、任务或用户故事。
version: 1.1.0
owners:
  - dachui
  - sunwencong
---

# 创建需求

从用户想法生成结构清晰的需求文档。

## 工作流

1. **捕捉** - 获取用户描述
2. **澄清** - 必要时提问
3. **结构化** - 按模板整理
4. **索引** - 写入当前变更包的任务索引
5. **存储** - 保存到当前变更包的进行中任务目录

## 模板

```markdown
# [REQ-XXX] 标题

## 摘要
[一句话说明]

## Resume Summary / 执行摘要
- Goal / 目标：
- Current Status / 当前状态：Draft / Running / Blocked / Done
- Constraints / 关键约束：
- Progress / 当前进展：
- Key Decisions / 关键决策：
- Relevant Files / 相关文件：
- Commands Run / 已运行命令：
- Verified / 已验证：
- Open Questions / 待确认：
- Next Steps / 下一步：
- Blockers / 阻塞点：
- Critical Context / 关键上下文：

## 用户故事
作为一名 [用户]，我希望 [目标]，以便 [收益]。

## 验收标准
- [ ] 标准 1
- [ ] 标准 2

## 优先级
[P0: 关键 | P1: 高 | P2: 中 | P3: 低]

## 工作量
[S/M/L/XL]
```

## 小贴士
- 保持需求原子化（每条仅一个功能）
- 验收标准可测试
- 关联相关设计文档
- 新建需求时必须写入初始 `Resume Summary / 执行摘要`；后续实现、交接、上下文压缩或并行汇总时持续更新
- 若需求规模较大（跨多个模块/里程碑），创建父需求后应继续使用 `ai-workflow/skills/common/task-split/` 进行批次拆分
