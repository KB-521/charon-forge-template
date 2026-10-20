# Skills 索引

本目录存放可复用的技能（skill）。每个 skill 以子目录管理，入口文件为 `SKILL.md`；索引递归收录 `ai-workflow/skills` 下所有包含 `SKILL.md` 的有效 skill 目录，路径相对于 `ai-workflow/skills`。

## 使用建议

1. 先在文档“Skill 清单”中定位目标 skill。
2. 再打开对应目录下的 `SKILL.md` 获取详细内容。

## Skill 清单

| 目录 | `name` | version | owners | 作用说明 | 典型使用时机 | 主要产出/关注点 |
| --- | --- | --- | --- | --- | --- | --- |
| `common/code-commit` | `code-commit` | 1.0.0 | dachui, sunwencong | 按 Conventional Commits 提交代码变更并使用结构化信息。 | 实现或修复完成后，需要按规范提交代码时。 | 结构化 commit message、提交类型约束与提交步骤。 |
| `common/codex-parallel-execute` | `codex-parallel-execute` | 1.6.0 | dachui, sunwencong | 基于父需求 `INDEX.md` 的 Ready 并行组校验边界并编排 Codex worker/subagent 并行执行。 | 用户明确要求并行执行任务组，且父需求索引存在 Ready 并行组时。 | 并行门禁结果、worktree/worker 编排、启动顺序、设计基线可见性与集成建议。 |
| `common/init-agent` | `init-agent` | 1.5.0 | dachui, sunwencong | 生成或更新根目录与代码子项目级 `AGENTS.md`，并承接项目技术导航。 | 仓库首次建立项目指南、`AGENTS.md` 过期，或执行 `$init init agent clear` 时。 | 根/子项目 `AGENTS.md`、子项目路由、技术导航与 memory 入口。 |
| `common/init-business` | `init-business` | 1.4.0 | dachui, sunwencong | 按仓库项目域生成“索引 + 摘要层”业务知识文档；支持 clear 模式覆盖重建目标业务文档。 | 需要初始化、刷新或 clear 重建项目域业务知识文档时。 | `ai-workflow/wiki/<project-domain>/business/INDEX.md` 与摘要层业务文档。 |
| `common/init-rules` | `init-rules-convention` | 1.12.0 | dachui, sunwencong | 初始化或刷新非 server domain 的 `ai-workflow/wiki/<project-domain>/rules/INDEX.md`；server 规则发布已禁用。 | 需要初始化或刷新非 server domain 规则目录，或纳入用户自定义规则时。 | 非 server domain rules 索引；server domain 保持冻结兼容区不修改。 |
| `common/init-skills` | `init-skills` | 1.1.0 | dachui, sunwencong | 递归扫描指定 skills 目录下的 skill 子目录，生成可维护的 skill 索引。 | 新增 skill、调整目录分组、skills 索引过期或需要 clear 重建时。 | 覆盖更新的 `skills/INDEX.md` 与缺失 metadata 提示。 |
| `common/prd-archive` | `prd-archive` | 1.0.0 | dachui, sunwencong | 通过语雀 Open API 拉取最新 PRD 并覆盖落库到 `ai-workflow/sdd/changes/<change-id>/prd`。 | PRD 审核完成后，需要从语雀拉取最新版本并归档时。 | 归档后的 PRD 文档与落库路径。 |
| `common/prd-review` | `prd-review` | 1.1.0 | dachui, sunwencong | 检查 PRD 是否结构化、功能点是否清晰且可实现。 | 进入技术方案或代码实现前需要审查 PRD，或 PRD 更新后需要复核历史问题时。 | 问题清单、业务对照证据、历史问题复核与修订建议。 |
| `common/req-create` | `req-create` | 1.1.0 | dachui, sunwencong | 从用户想法创建结构化需求文档。 | 需要把新想法落成当前变更包里的结构化需求时。 | 需求索引条目、`in-progress` 需求文档与执行摘要。 |
| `common/skill-creator` | `skill-creator` | 1.0.0 | dachui, sunwencong | 创建或更新扩展 Codex 能力的技能。 | 需要新增 skill 或改造现有 skill 时。 | skill 结构规范、`SKILL.md` 设计要点与配套资源建议。 |
| `common/task-split` | `task-split` | 1.10.2 | dachui, sunwencong | 将技术方案按复杂度和页面/后端任务类型拆分为可开发、可验收、可并行执行的实现子任务。 | 技术方案评审后、进入实现前需要拆任务时。 | 通用任务结构、模板公共块、短码子任务命名、后端自适应粒度、子任务复杂度预算、SQL 目录命名空间、前端页面拆分与并行边界。 |
| `common/tech-design-review-template` | `tech-design-review-template` | 1.0.0 | dachui, sunwencong | 基于技术方案文档生成 Review 模版。 | 技术方案完成后、正式评审前需要建立 review 文档时。 | 技术方案 review 模版与问题追踪结构。 |
| `server/backend-design` | `backend-design` | 1.12.0 | sunwencong | 将 PRD、任务和变更输入冻结为后端技术方案、API 契约、数据模型引用与实现边界。 | 需求评审后、后端编码前需要冻结 API、模块边界、数据影响或实现边界时。 | 后端技术方案、字段级 API 契约、数据模型产物引用与设计包索引。 |
| `server/code-review` | `code-review` | 1.3.0 | sunwencong | 评审后端代码质量、缺陷、安全风险与接口文档漂移。 | 用户明确要求后端 code review、PR/CI 流程需要评审或问题定位时。 | 按优先级分组的问题清单、风险、修复建议与待确认项。 |
| `server/data-model-design` | `data-model-design` | 1.3.4 | sunwencong | 从 PRD、任务或后端技术方案冻结逻辑数据模型、物理表结构、SQL 契约、兼容口径与字典/枚举方案；无参考时按本 skill 默认规范冻结 SQL 目录和基础字段。 | 需要确认后端数据模型、表结构、索引、基础字段、字典枚举或存量兼容口径时。 | 逻辑数据模型、SQL 契约、结构化 SQL 目录、字典/枚举方案、持久化交接与校验结论。 |
| `server/entry-impl` | `entry-impl` | 1.0.0 | sunwencong | 实现后端对外 HTTP 入口层，包括 Endpoint/Controller、DTO/VO、路由、参数校验和响应封装。 | service 能力已确认，需要新增或修改 API 入口、请求响应模型或字段级契约时。 | Endpoint/Controller、DTO/VO、入口校验、响应封装、YApi 同步建议。 |
| `server/init-business` | `init-business-backend` | 1.0.0 | sunwencong | 后端 init-business 兼容入口，实际规则已迁移到 `common/init-business/references/backend.md`。 | 旧路径仍被引用，或需要从后端兼容入口跳转时。 | 将执行路由到统一 `common/init-business` 后端规则。 |
| `server/pay-starter-impl` | `pay-starter-impl` | 1.0.1 | xuyang | 指导 my-archetype 支付渠道 starter 实现、接入或合规校验，并说明 measure 接入边界。 | 新增或 review alipay、wechatpay、applepay、googlepay、stripepay、paypal、payout/remittance 类似第三方支付渠道 starter 时。 | starter/measure 职责边界、开发主链、源码参考、测试矩阵与合规 findings；payout 也必须保留 starter endpoint 与统一 pay starter 依赖。 |
| `server/persistence-impl` | `persistence-impl` | 1.3.1 | sunwencong | 根据已冻结的数据模型和 SQL 目录规则生成或修改 DDL、DML、history compat、rollback/fixforward 与 manifest；无参考时按本 skill 默认规范生成 SQL。 | 表结构、字段、索引、字典数据、配置数据或数据修复方案已冻结，需要落 SQL 文件时。 | SQL 文件、默认基础字段/默认值、执行顺序、幂等、影响范围、回滚/补救与 manifest。 |
| `server/req-impl` | `req-impl` | 2.0.0 | sunwencong | 实现后端业务执行层，包括 Service/Facade、状态机、事务、幂等、补偿、定时任务、MQ、事件和外部能力编排。 | 已有持久化能力，需要实现业务规则、worker 入口或外部能力编排时。 | 业务执行代码、事务/幂等/补偿说明、验证结果与剩余风险。 |
| `server/skeleton-codegen` | `skeleton-codegen` | 2.3.1 | sunwencong | 根据已冻结的数据模型和 SQL 文件生成或补齐 Java 持久化代码骨架；无参考时按 Metac Profile 或 Generic Profile 独立生成。 | SQL 文件已确认，需要补齐 generator、PO/POQuery、DAO/Repository、Mapper XML、sqlmapplus/OpenDAO 或薄 Manager 时。 | Java 持久化骨架、profile 选择、方法契约、映射自检、后续业务/入口路由。 |
| `server/test-codegen` | `test-codegen` | 1.2.0 | sunwencong | 只生成后端 `unit` / `api-mock` Java 测试代码。 | 用户只想补 Java 测试代码，且不想引入完整测试资产链路时。 | `*Test.java` / `*EndpointIT.java` 代码、覆盖场景说明、执行命令与剩余风险。 |
| `server/yapi-mcp-sync` | `yapi-mcp-sync` | 1.2.0 | sunwencong | 通过本地 MCP 将 Spring Boot `**Endpoint` 接口按字段级契约上传到 YApi。 | Endpoint 开发完成后，需要同步或补齐 YApi 文档时。 | 字段级 YApi 接口文档、Endpoint 分组映射、upsert 统计与失败清单。 |
| `web/api-impl` | `api-impl` | 1.1.0 | dachui | 基于 YAPI MCP 或指定文档输入实现前端 API 接口。 | 前端已有接口定义，需要落地 `src/api` 请求文件时。 | 前端 API 请求文件、类型命名、导出约定与代码示例。 |
| `web/api-mock` | `api-mock` | 1.0.0 | dachui | 为接口提供本地 mock/假数据联调能力。 | 需要本地 mock、假数据联调或 stub 后端时。 | mock 路由、假数据文件与请求层分发逻辑。 |
| `web/code-review` | `code-review` | 1.0.0 | dachui | 评审前端代码质量、正确性、状态一致性与交互边界。 | 用户明确要求前端 code review、PR/CI 流程需要评审或问题定位时。 | 按优先级分组的前端问题清单、修复建议与剩余风险。 |
| `web/d2c` | `d2c` | 1.0.0 | dachui | 基于 Figma 链接高保真还原 React + Tailwind 页面并输出可追溯实现清单。 | 需要把 Figma 设计稿高保真还原成 Web 页面时。 | 可追溯的节点实现清单、节点映射与计算依据。 |
| `web/frontend-tech-solution-design` | `frontend-tech-solution-design` | 1.1.0 | dachui | 基于 PRD、原型和评审结论设计前端技术方案。 | 前端开发前，需要先冻结页面、状态和接口映射口径时。 | 前端技术方案文档、设计包索引与可选拆分设计文档。 |
| `web/rn-d2c` | `rn-d2c` | 1.0.0 | 未声明 | 基于 Figma 链接还原 React Native Expo 页面。 | 需要把 Figma 设计稿高保真还原成 React Native 页面时。 | RN 节点实现清单、节点映射与视觉计算依据。 |
| `web/task-impl` | `task-impl` | 1.2.0 | dachui | 执行前端任务实现，默认只做实现自检与建议验证记录。 | 需要按固定顺序落地前端功能实现时。 | 接口、mock、页面实现、自检记录与建议验证方式。 |
