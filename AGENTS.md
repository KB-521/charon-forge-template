# 仓库规范

> 本文件由初始化流程维护，记录可从仓库验证的长期协作规则。团队与个人偏好统一由 `ai-workflow/memory/` 承接。

## Memory 入口

- 执行任务前读取 `ai-workflow/memory/INDEX.md`，按索引读取 `TEAM.md`，以及存在时的 `LOCAL.md`。
- 团队共享约定写入 `ai-workflow/memory/TEAM.md`；个人本地约定写入 `ai-workflow/memory/LOCAL.md`，后者不提交。
- 初始化不得覆盖、删除或合并 memory 中的手写内容；不要将偏好复制到本文件。

## 项目结构与模块组织

当前仓库包含一个 TypeScript / Node.js CLI 工具包与 AI 协作流程知识库。根 `package.json` 是唯一 CLI 工具包，`cli/` 为源码目录，不是独立 package；`templates/` 存放独立原生项目负载，当前包含 `web/nextjs` 与 `fullstack/vite-nestjs` 通用模板，其依赖在仓库外生成工程中管理。

```text
.
├── AGENTS.md               # 仓库协作规则与导航入口
├── README.md               # CLI 与模板维护说明入口
├── package.json            # 唯一 CLI 包与维护命令，Node 22.12+ / pnpm 10.18.3
├── cli/src/                # CLI 参数交互与内部生成核心
├── schemas/                # JSON Schema 协议事实源
├── scripts/                # 模板导入、打包、隔离开发与交互增量发布
├── templates/              # 分类/模板/files 原生工程负载，含 web/nextjs、fullstack/vite-nestjs
├── tests/                  # 临时 Git 仓库、归档与 HTTP fixture 行为验证
├── docs/                   # 使用、贡献、开发与发布说明
├── forge.config.json       # 构建时固定分发源，已配置本仓库 Pages 地址
├── agent.config            # 代理配置占位文件，当前为空
├── .codex/skills/          # Codex 可调用的流程入口技能
└── ai-workflow/            # 流程知识库，具体要求由对应入口文档维护
    ├── agent/             # 意图路由与需求、设计、实现角色定义
    ├── memory/            # 团队与个人约定及读取索引
    ├── sdd/               # 设计、任务和实现验证记录
    └── skills/            # 通用、后端、前端技能及配套模板和脚本
```

`ai-workflow/skills/server/` 和 `ai-workflow/skills/web/` 是技能分类目录，不代表仓库已有后端或前端应用。`ai-workflow/sdd/` 已建立；`ai-workflow/wiki/` 当前为空，尚无项目域业务或规则文档。

## 流程入口与模块职责

| 范围 | 职责与入口 | 常见下钻（在仓库根目录执行） |
| --- | --- | --- |
| `cli/src/commands/` | 参数、TTY 交互与创建流程；入口为 `cli/src/index.ts` | `rg --files cli/src/commands` |
| `cli/src/core/` | 协议、catalog、下载缓存、安全暂存、独占提交和固定安装适配器 | `rg --files cli/src/core` |
| `schemas/` | 字段真源；生成的 `schemas.generated.ts` 不手工编辑 | `pnpm schemas:generate` |
| `scripts/` | 导入、Git 跟踪白名单打包、仓库外开发、catalog、交互发布与预览 | `rg --files scripts` |
| `templates/` | 原生模板，各自维护依赖；不加入根 workspace；入口见 `templates/web/nextjs/README.md`、`templates/fullstack/vite-nestjs/README.md` | `rg --files templates -g template.json` |
| `.codex/skills/` | 对外技能入口；初始化入口为 `.codex/skills/init/SKILL.md`，统一任务入口为 `.codex/skills/req-dev/SKILL.md` | `rg --files --hidden .codex/skills` |
| `ai-workflow/agent/` | `phase-router.md` 按意图与复杂度路由到对应角色文档 | `rg --files ai-workflow/agent` |
| `ai-workflow/skills/` | `INDEX.md` 为技能索引，具体规则以目标目录的 `SKILL.md` 及其引用为准 | `rg --files ai-workflow/skills -g SKILL.md` |
| `ai-workflow/memory/` | `INDEX.md` 为自定义约定的唯一读取入口 | `cat ai-workflow/memory/INDEX.md` |

- 任意需求、设计、实现、评审或记录任务遵循 `.codex/skills/req-dev/SKILL.md`：加载 Memory，再读取 `ai-workflow/agent/phase-router.md` 与目标 Agent，按该 Agent 工作流执行。
- 最终交付注明实际使用的 Agent 和 skill；没有命中 skill 时如实说明。
- 修改流程知识库时，先定位 `ai-workflow/skills/INDEX.md`，再读取对应 `SKILL.md` 和必要引用，避免将全部模板规则当作当前项目事实。
- `.codex/skills/init/SKILL.md` 负责初始化范围与 clear 模式识别；实际初始化逻辑由 `ai-workflow/skills/common/init-*/SKILL.md` 承接。
- 需求与设计产物按对应 skill 落入 `ai-workflow/sdd/`；业务和规则知识按项目域落入 `ai-workflow/wiki/`，具体初始化范围以对应 skill 的域发现与画像规则为准。
- 不为流程知识库生成 `ai-workflow/AGENTS.md`；技术导航由根目录及未来实际代码子项目的 `AGENTS.md` 承接，不默认生成 `wiki/<project-domain>/tech/*`。
- 只有用户表达并行执行意图时，才按 `common/codex-parallel-execute/SKILL.md` 校验并行门禁；任务标注可并行不等于授权启动多个 worker。

## 构建、测试与维护命令

在仓库根目录使用 Node.js 22.12+ 和 pnpm 10.18.3。根安装只管理 CLI 与维护工具；模板工程在仓库外独立安装。技能附带脚本的执行条件仍以对应 `SKILL.md` 为准。

| 命令 | 用途 |
| --- | --- |
| `pnpm install --frozen-lockfile` | 安装锁定工具依赖 |
| `pnpm build` / `pnpm typecheck` | 生成协议类型并构建 / 检查工具代码 |
| `pnpm test` | 框架测试；fixture 不进入 templates 或 CLI 包 |
| `pnpm templates:validate` / `pnpm templates:pack` | 校验与确定性归档；空模板目录有效 |
| `pnpm template:import --help` / `pnpm template:dev --help` | 导入现有项目 / 仓库外开发参数 |
| `pnpm verify:templates` | 隔离生成和防污染；原生命令须显式 `--native` |
| `pnpm verify:distribution` | 实际 npm 包的隔离安装与命令检查，会联网安装运行依赖 |
| `pnpm catalog:build --dry-run` | 在归档清单生成后校验 catalog，不写产物 |
| `pnpm release` / `pnpm release --dry-run` | 交互选择增量模板及 CLI 并触发正式 Actions / 只预览变化 |

`forge.config.json` 的源配置在构建时固化，已配置本仓库计划使用的 Pages 地址；是否可用取决于实际发行。`.github/workflows/release.yml` 是串行正式发布入口，会创建模板 Release、部署 Pages 并按选择发布 npm；原 release-templates/release-cli workflows 仍仅生成预览。日常使用 `pnpm release`，只验证和上传选中模板，保留完整历史；具体首次配置和外发步骤见 `docs/releasing.md`。

正式 CLI 自动发布采用 npm Trusted Publisher（OIDC），workflow 使用 Node 22 与 npm 11.21.0；首次交互发布与身份绑定见 `docs/releasing.md`，不在仓库保存长期发布 token。生成工具的 Node 22.12+ 要求与发布环境要求分别维护。

在仓库根目录可执行：

- `rg --files --hidden -g '!.git'`：定位文件，包括隐藏目录中的技能入口。
- `git status --short`：检查工作区变更。
- `git diff --check`：检查变更中的空白错误。
- `git diff -- AGENTS.md`：检查根指南变更。
- `git log --oneline -n 20`：查看近期提交约定。

## 文档与维护约定

- 维护 Markdown 标题、代码块和表格结构；skill 的元信息、模板和脚本接口遵循对应 `SKILL.md`，不将占位示例写成真实项目事实。
- 入口技能保留路由职责，具体规则在委托的 skill 中维护，避免重复复制导致规则漂移。
- 新增或调整技能时，按 `common/init-skills/SKILL.md` 维护技能索引；仅初始化 agent 时不额外刷新其它产物。
- CLI 使用 TypeScript 严格模式、ESM 与 Prettier；模块通过 `.js` 扩展名引用。schema 类型从 JSON 真源生成，工具源码和模板负载分开验证。
- 不在模板 `files/` 内安装、运行或自动回写；已跟踪文件与 include 构成发布输入，运行产物禁止项独立于 `.gitignore` 检查。
- Next.js 模板的 `docker-config/.env.dev`、`.env.prod` 是受控的公开运行时配置，根 `.gitignore` 显式放行；其内容会注入浏览器，不得放入敏感信息。其它真实环境文件仍按安全边界排除。
- 当前仓库不包含实际应用服务或数据库；模板分发的发布与部署验证记录见 `ai-workflow/sdd/INDEX.md` 及对应变更包。引入实际代码子项目后再更新对应技术导航，不把模板示例写成现有应用。

## Git 与安全

- 提交前检查差异，保留用户已有修改，只提交当前任务相关文件。
- 需要提交时读取 `ai-workflow/skills/common/code-commit/SKILL.md`，按其 Conventional Commits 约定执行；近期提交包含英文描述与合并记录，不据此推导额外团队规范。
- 不在指南、memory、模板、日志或提交中写入密钥、令牌、账号、连接串等敏感值。
- 提交前确认 `ai-workflow/memory/LOCAL.md` 未纳入本次提交；根 `.gitignore` 声明忽略该文件、工具产物、依赖和真实环境文件；忽略规则不会解除已跟踪状态，仍需用 `git ls-files` 和暂存差异检查。
