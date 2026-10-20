---
name: experience-record
description: 收到沉淀经验、记录经验或整理经验教训请求时使用；根据反馈提炼可复用经验，写入 ai-workflow/wiki/experience/ 并更新索引。
version: 1.0.0
owners:
  - dachui
  - sunwencong
---

# 经验沉淀

根据反馈提炼可复用经验，并写入经验库。

## 分类

| 标签 | 用途 |
| --- | --- |
| `[BUG]` | 缺陷原因、修复方式与预防手段 |
| `[PATTERN]` | 可复用的成功模式 |
| `[PITFALL]` | 需要避免的坑和误判路径 |
| `[DECISION]` | 重要决策及取舍依据 |
| `[PERF]` | 性能优化经验 |
| `[TOOL]` | 工具、环境或命令使用经验 |

## 模板

```markdown
# [分类] 标题

## 摘要
[一句话说明经验]

## 可复用性
[未来在哪类场景复用；若写不出，停止沉淀]

## 问题
[问题是什么，为什么值得记录]

## 解决方案
[如何解决，后续如何复用]

## 证据
[可选：代码路径、命令、报错、日志、文档路径]

## 预防
[未来如何避免]

## 标签
#tag1 #tag2
```

## 输出位置

```text
ai-workflow/wiki/experience/<type>-<topic>.md
ai-workflow/wiki/experience/INDEX.md
```

## 执行步骤

1. 先基于用户反馈判断是否通过可复用门禁。
2. 选择分类和文件名，文件名使用小写短横线：`<type>-<topic>.md`。
3. 写入经验条目，避免记录敏感信息或一次性流水账。
4. 更新 `ai-workflow/wiki/experience/INDEX.md`，保持索引只列真实存在的经验文件。
5. 最终回复说明新增经验路径；若未写入，说明未通过门禁的原因。
