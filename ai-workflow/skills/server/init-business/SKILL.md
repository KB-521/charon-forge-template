---
name: init-business-backend
description: 后端 init-business 兼容入口；实际规则已迁移到 ai-workflow/skills/common/init-business/references/backend.md
version: 1.0.0
owners:
  - sunwencong
---

# 初始化业务知识沉淀（后端兼容入口）

## 作用

- 兼容旧的 `ai-workflow/skills/server/init-business` 调用路径。
- 真正的后端业务知识沉淀规则，统一维护在 common skill 中。

## 使用方式

1. 先读取 `ai-workflow/skills/common/init-business/SKILL.md`。
2. 再读取 `ai-workflow/skills/common/init-business/references/backend.md` 执行后端规则。
3. 后续若要修改后端规则，只改 common skill，不在本文件重复维护。

## 边界

- 本文件只做转发，不重复定义后端业务沉淀规则。
- 若旧路径仍被调用，应直接引导到 common skill，而不是在这里追加新逻辑。
