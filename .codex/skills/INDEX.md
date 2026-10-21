# Skills 索引

本目录存放可直接调用的技能入口；具体规则以各目录的 `SKILL.md` 为准。

## 使用建议

1. 按任务在清单定位入口。
2. 阅读对应 `SKILL.md`，按需加载其引用。

## Skill 清单

| 目录 | `name` | version | owners | 作用说明 | 典型使用时机 | 主要产出/关注点 |
| --- | --- | --- | --- | --- | --- | --- |
| `archive` | `archive` | 1.4.0 | dachui | 将一个或多个已完成的 SDD changes 变更包从 ai-workflow/sdd/changes 迁移到 ai-workflow/sdd/archive，并同步更新 ai-workflow/sdd/INDEX.md；用于用户要求归档、archive、批量归档、收口已完成变更包时。 | 见对应 skill 的触发场景。 | 见对应 skill 的执行与交付要求。 |
| `charon-forge-init` | `charon-forge-init` | 1.0.0 | dachui, sunwencong | 使用 Charon Forge 模板创建新的 Next.js、Vite + React + NestJS 或 Java Spring Boot 项目。适用于“初始化工程”“用模板创建项目”等请求；不负责刷新已有项目的 AGENTS.md、业务文档或规则。 | 见对应 skill 的触发场景。 | 见对应 skill 的执行与交付要求。 |
| `ci-test-codegen` | `ci-test-codegen` | 1.0.0 | sunwencong | 在 GitLab MR / Jenkins / CI 容器中运行 Codex 时使用；读取 GitLab MR webhook payload 或 CI 环境变量，识别 MR diff 中的后端 Java 增量，调用 server/test-codegen 生成 unit/api-mock Java 测试代码，执行全部相关测试，把执行结果发布到 GitLab MR 评论区，并将生成的测试代码提交回 MR 源分支。 | 见对应 skill 的触发场景。 | 见对应 skill 的执行与交付要求。 |
| `experience-record` | `experience-record` | 1.0.0 | dachui, sunwencong | 收到沉淀经验、记录经验或整理经验教训请求时使用；根据反馈提炼可复用经验，写入 ai-workflow/wiki/experience/ 并更新索引。 | 见对应 skill 的触发场景。 | 见对应 skill 的执行与交付要求。 |
| `init` | `init` | 1.2.0 | dachui, sunwencong | 根据用户输入执行全量或特定初始化；支持 clear 模式；未指定具体范围时，默认依次初始化 AGENTS.md、业务文档、规则文档与 skills 索引 | 见对应 skill 的触发场景。 | 见对应 skill 的执行与交付要求。 |
| `req-dev` | `req-dev` | 1.4.0 | dachui | AI 任务统一入口与执行门禁（强制流程） | 见对应 skill 的触发场景。 | 见对应 skill 的执行与交付要求。 |
