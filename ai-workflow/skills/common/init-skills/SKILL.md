---
name: init-skills
description: 递归扫描指定 skills 目录下的 skill 子目录，生成可维护的 skill 索引；支持 clear 模式覆盖重建 INDEX.md
version: 1.1.0
owners:
  - dachui
  - sunwencong
---

# 初始化 Skills 索引

为目标 `skills` 目录创建或更新 `INDEX.md`，沉淀当前可用 skill 的目录、名称、版本、负责人与用途，避免后续重复遍历目录。

## 适用场景

- 新增了一个或多个 skill，需要同步更新目录索引。
- 现有 `INDEX.md` 缺失、过期或与实际 skill 目录不一致。
- 需要快速让 agent 或开发者知道当前有哪些 skill 可用。

## 默认目标

- 若用户明确指定目录，使用用户给定的 `skills` 目录。
- 若用户未指定目录，优先处理当前仓库中的 `ai-workflow/skills`。

## 范围约束

### 允许写入

- 目标 `skills` 目录下的 `INDEX.md`。
- 为生成索引所必需的最小补充说明。

### clear 模式

- 普通模式：覆盖更新 `INDEX.md`，保持条目稳定排序。
- clear 模式：先丢弃旧 `INDEX.md` 内容，再按扫描结果重建。
- clear 不修改任何 `SKILL.md`。

### 禁止写入

- 任意 skill 的业务实现文件，除非用户明确要求同步修正。
- 与 skill 索引无关的 wiki、源码或配置文件。
- 凭空杜撰不存在的 skill、目录或用途。

## 执行步骤

1. 扫描目标目录
- 递归扫描目标 `skills` 目录下的子目录。
- 仅将包含 `SKILL.md` 的目录视为有效 skill。
- 过滤隐藏目录与非 skill 目录。
- 索引中的“目录”字段使用相对于目标 `skills` 目录的路径，例如：`common/init-skills`。

2. 采集事实
- 读取每个 `SKILL.md` 的 frontmatter，提取 `name`、`description`、`version`、`owners`。
- 若 `version` 或 `owners` 缺失，不得凭空补齐；索引中标记为 `未声明`，并在结果中提示需要补齐的 skill。
- 如 `description` 不足以支撑索引条目，再读取正文前部，补充“典型使用时机”和“主要产出/关注点”。

3. 生成或更新 `INDEX.md`
- 文档结构参考 `ai-workflow/skills/INDEX.md`。
- 保持以下固定结构：
  - 标题：`# Skills 索引`
  - 简介段
  - `## 使用建议`
  - `## Skill 清单`
- 表格字段固定为：`目录 | name | version | owners | 作用说明 | 典型使用时机 | 主要产出/关注点`

4. 幂等更新
- 若 `INDEX.md` 已存在，覆盖更新内容而不是追加重复条目。
- 条目按相对目录路径排序，确保重复运行结果稳定。

## 写作规则

- 内容必须来自实际目录与 `SKILL.md`，不做主观扩展。
- `作用说明` 优先来自 `description` 的压缩表达。
- `典型使用时机` 聚焦触发条件，不堆砌流程细节。
- `主要产出/关注点` 聚焦该 skill 执行后的核心结果或检查重点。
- 文案保持简洁，单元格优先一句话说明。
- 若存在分组目录，必须继续向下索引实际 skill，不得只记录分组目录本身。

## 输出模板

```markdown
# Skills 索引

本目录存放可复用的技能（skill）。每个 skill 以子目录管理，入口文件为 `SKILL.md`；索引可包含多级子目录中的 skill。

## 使用建议

1. 先在文档“Skill清单”定位目标skill。
2. 再打开对应skill文档获取详细内容。

## Skill 清单

| 目录 | `name` | version | owners | 作用说明 | 典型使用时机 | 主要产出/关注点 |
| --- | --- | --- | --- | --- | --- | --- |
| xxx | xxx | 1.0.0 | dachui | xxx | xxx | xxx |
```

## 校验项

- `INDEX.md` 已创建或更新到目标 `skills` 目录。
- 每个条目都能对应到真实存在的 `SKILL.md`。
- 每个条目都包含 `version` 与 `owners`；缺失项已标记并在结果中提示。
- 不包含隐藏目录、无效目录或重复条目。
- 多级子目录中的有效 skill 已被正确收录。
- 表格字段与顺序符合模板要求。
