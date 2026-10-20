# Memory 索引

本目录是团队偏好、个人偏好和阶段性执行约定的唯一入口。

执行任务前必须先读取本索引，再按下表读取对应 memory 文件。

## 文档清单

| 文档 | 内容边界 | 读取时机 |
| --- | --- | --- |
| `ai-workflow/memory/TEAM.md` | 可提交的团队偏好、长期共享约定和协作规则。 | 每次任务必读。 |
| `ai-workflow/memory/LOCAL.md` | 个人偏好、本地环境说明和临时执行习惯。 | 文件存在时读取，不提交。 |

## 维护规则

1. 单文件保持短小，只保留高频、稳定、会影响执行方式的信息。
2. 需求上下文、设计方案和任务状态写入 `ai-workflow/sdd/changes/<change-id>/`。
3. 业务知识和规则知识写入 `ai-workflow/wiki/<domain>/business` 或 `ai-workflow/wiki/<domain>/rules`。
4. 团队共享偏好写入 `ai-workflow/memory/TEAM.md`；个人私有偏好写入 `ai-workflow/memory/LOCAL.md`。
5. 不要在 memory 中写入密钥、令牌、账号、连接串等敏感值。
6. 初始化流程不得覆盖、删除或合并本目录中的手写内容。
