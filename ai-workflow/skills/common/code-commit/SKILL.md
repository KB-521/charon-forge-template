---
name: code-commit
description: 按照 Conventional Commits 提交代码变更并使用结构化信息。在实现或修复完成后需要提交时使用。
version: 1.0.0
owners:
  - dachui
  - sunwencong
---

# 代码提交

创建结构清晰、信息明确的 git 提交。

## 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

## 类型

| 类型 | 用途 |
|------|------|
| `feat` | 新功能 |
| `fix` | 缺陷修复 |
| `docs` | 文档 |
| `refactor` | 代码重构 |
| `test` | 新增测试 |
| `chore` | 维护类事务 |

## 示例

```bash
feat(auth): add user login functionality

Implement JWT-based authentication with:
- Login endpoint
- Token validation

Closes #123
```

```bash
fix(api): handle null response in user query
```

## 规则

1. **原子性** - 每个提交只包含一个逻辑变更
2. **现在时态** - 用 “add” 而不是 “added”
3. **50/72** - 标题 ≤50 字符，正文每行 72 字符换行
4. **关联问题** - 使用 `Closes #123` 或 `Fixes #456`
