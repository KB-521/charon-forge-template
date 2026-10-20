---
name: init
description: 根据用户输入执行全量或特定初始化；支持 clear 模式；未指定具体范围时，默认依次初始化 AGENTS.md、业务文档、规则文档与 skills 索引
version: 1.2.0
owners:
  - dachui
  - sunwencong
---

# 初始化项目指南（入口）

本文件作为 `init` skill 的入口，实际执行逻辑委托给：

- `ai-workflow/skills/common/init-agent/SKILL.md`
- `ai-workflow/skills/common/init-business/SKILL.md`
- `ai-workflow/skills/common/init-rules/SKILL.md`
- `ai-workflow/skills/common/init-skills/SKILL.md`

## 输入识别规则

1. 先解析用户输入中是否包含模式修饰符：
   - 命中 `clear`、`清空`、`重新生成`、`重生成`、`全量重写`：启用 clear 模式。
   - `clear` 只是模式修饰符，不是初始化范围，不得因为出现 `clear` 自动扩大初始化项。
   - 示例：`$init init agent clear` 只执行 `init-agent`，并以 clear 模式执行。
2. 再解析用户输入中是否明确指定初始化范围：
   - 命中 `AGENTS`、`项目指南`、`仓库规范`：执行 `ai-workflow/skills/common/init-agent/SKILL.md`
   - 命中 `技术`、`tech`、`技术文档`：不得执行已废弃的 `init-tech`；提示“技术导航已由各子项目 `AGENTS.md` 承接，请使用 `$init init agent clear` 刷新”。
   - 命中 `业务`、`business`、`业务文档`：执行 `ai-workflow/skills/common/init-business/SKILL.md`
   - 命中 `规则`、`rules`、`规则文档`：执行 `ai-workflow/skills/common/init-rules/SKILL.md`
   - 命中 `skills`、`skill 索引`、`技能索引`：执行 `ai-workflow/skills/common/init-skills/SKILL.md`
3. 若输入同时命中多个初始化项，只执行命中的项，并按默认顺序编排：
   - `init-agent` → `init-business` → `init-rules` → `init-skills`
4. 若输入未明确指定范围，或明确表达“全部初始化 / 全量初始化 / 初始化项目”，执行默认全量初始化流程。
5. 若输入只命中已废弃的 `tech` 范围，不得退化为默认全量初始化；只输出废弃提示和替代命令。
6. 不得因为触发了某一个初始化项而强制执行全部初始化；只有在未指定范围或用户明确要求全量时才执行全链路。
7. clear 模式必须传递给所有被执行的子 skill，由子 skill 按各自目标产物执行覆盖重建。

## 调用规则

### A. 特定初始化

1. 用户触发 `init` skill 且明确指定初始化范围时，仅执行命中的初始化项。
2. 若命中多个初始化项，按以下顺序执行命中的项：
   - `ai-workflow/skills/common/init-agent/SKILL.md`
   - `ai-workflow/skills/common/init-business/SKILL.md`
   - `ai-workflow/skills/common/init-rules/SKILL.md`
   - `ai-workflow/skills/common/init-skills/SKILL.md`
3. 未命中的初始化项不得自动补跑。
4. 若命中 clear 模式，必须把 clear 模式传递给命中的初始化项；例如 `$init init agent clear` 等价于“仅执行 init-agent 的 clear 模式”。

### B. 默认全量初始化

1. 用户触发 `init` skill 且未明确指定范围时，先读取并执行 `ai-workflow/skills/common/init-agent/SKILL.md`。
2. 完成 `AGENTS.md` 规范与技术导航沉淀后，读取并执行 `ai-workflow/skills/common/init-business/SKILL.md`，按项目域同步维护 `ai-workflow/wiki/<project-domain>/business/*` 业务文档。
3. 完成业务文档沉淀后，读取并执行 `ai-workflow/skills/common/init-rules/SKILL.md`，按项目域同步维护 `ai-workflow/wiki/<project-domain>/rules/**` 文档；未指定 domain 时扫描全部项目域，禁止写入根层 `ai-workflow/wiki/rules/**`。
4. 完成规则文档沉淀后，读取并执行 `ai-workflow/skills/common/init-skills/SKILL.md`，同步维护 `ai-workflow/skills/INDEX.md` 索引文档。
5. 若默认全量初始化同时命中 clear 模式，以上每一项都以 clear 模式执行。
