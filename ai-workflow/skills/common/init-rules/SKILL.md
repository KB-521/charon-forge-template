---
name: init-rules-convention
description: 初始化或刷新非 server domain 的 ai-workflow/wiki/<project-domain>/rules/INDEX.md；server 规则发布已禁用，server 规则真源迁移到各功能 skill 的 references/rules
version: 1.12.0
owners:
  - dachui
  - sunwencong
---

# 初始化规则同步

> server 规则发布功能已禁用。`ai-workflow/wiki/server/rules/` 保留为冻结兼容区，不再由本 skill 同步或作为默认执行入口。

## 作用

- 初始化或刷新非 server domain 的 `ai-workflow/wiki/<project-domain>/rules/INDEX.md`。
- 未指定 domain 时，扫描 `ai-workflow/wiki/*` 下除 `experience` 外的一级目录。
- 跳过 `server` domain；server 规则由各 `ai-workflow/skills/server/<skill>/references/rules/` 承接。
- 保留发布区已有用户规则，只刷新索引。
- 不默认保留 `internal/`、平台 SDK 清单、项目专项清单等非通用规则。

## 真源

- 非 server domain 规则真源：对应 `ai-workflow/wiki/<project-domain>/rules/` 中的手写规则。
- server 规则真源：对应功能 skill 的 `references/rules/`；共享门禁在 `ai-workflow/skills/server/_shared/references/rules/`。
- `ai-workflow/skills/common/init-rules/rules/*.md` 仅作为 legacy 迁移参考，不再发布到 server。

## 同步规则

- 非 server domain：确保 `ai-workflow/wiki/<project-domain>/rules/INDEX.md` 存在，并按当前目录下 Markdown 刷新索引。
- `server` domain：跳过，不复制、不刷新、不清理，避免覆盖已迁移到 skill-local references 的规则。
- 发布区中非当前主规则映射的通用用户规则默认保留并纳入索引。
- `internal/`、platform、SDK 清单、项目专项清单不属于通用规则；除非用户明确指定保留，否则必须清理。
- 禁止从发布区反推真源。

## 规则修改同步门禁

- 修改 server 规则时，只改对应功能 skill 的 `references/rules/`，并同步该 skill 的 `SKILL.md` 与 `ai-workflow/skills/INDEX.md` 版本。
- 禁止把 server 规则同步回 `ai-workflow/wiki/server/rules/`。
- 修改非 server domain 规则时，只刷新对应 domain 的 rules `INDEX.md`。

## clear 模式

- 普通模式：创建缺失目录，刷新非 server 目标 domain 的 `INDEX.md`；server domain 跳过。
- clear 模式：重建非 server 目标 domain 的 `INDEX.md`；server domain 跳过。
- clear 不删除发布区非当前主规则映射的通用用户规则。
- clear 必须清理 `internal/`、platform、SDK 清单、项目专项清单等非通用规则，除非用户明确指定保留。

## 规则结构要求

- 非 server domain 规则建议保留：
  - `## 适用场景`
  - `## 命中条件`
  - 规则正文或检查清单
- server skill-local 规则结构由对应 `references/rules/INDEX.md` 和 `rule-map.md` 约束。

## INDEX 要求

- 只保留标题、`读取流程` 和一个 `规则列表` 表格。
- 表格覆盖目标 rules 目录下除 `INDEX.md` 外的全部 Markdown。
- 不按内置、用户、专项分组；统一按路径列入同一张表。
- 索引说明优先取 `## 适用场景` 首段，其次取首段正文，最后退化到“按规则正文下钻”。
- 没有规则正文的 domain，表格中写明“当前暂无规则正文”。

## 完成标准

- 目标 domain 的 `rules/INDEX.md` 存在且路径可读。
- server domain 未被本 skill 修改。
- 通用用户规则没有被删除或覆盖。
- `internal/`、platform、SDK 清单、项目专项清单等非通用规则不再出现在通用发布区索引中。
- 重复执行保持幂等，不产生重复文件。
