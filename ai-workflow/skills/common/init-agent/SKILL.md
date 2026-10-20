---
name: init-agent
description: 为前端、移动端、后端或混合仓库生成/更新根目录与代码子项目级 AGENTS.md，并承接项目技术导航；自定义偏好统一路由到 ai-workflow/memory。
version: 1.5.0
owners:
  - dachui
  - sunwencong
---

# 初始化项目指南

## 目标

- 为当前仓库生成或更新根目录与代码子项目级 `AGENTS.md`，沉淀长期有效的协作规范。
- 用各子项目 `AGENTS.md` 承接技术导航、模块职责、常见下钻命令和代码落位边界；不再生成 `ai-workflow/wiki/<project-domain>/tech/*` 默认技术文档。
- 混合仓库采用“根目录总入口 + 代码子项目级 AGENTS”的两层结构，避免根目录堆满子项目细节。
- `AGENTS.md` 是初始化流程维护的生成层；团队偏好写入 `ai-workflow/memory/TEAM.md`，个人偏好写入 `ai-workflow/memory/LOCAL.md`。
- `ai-workflow/` 目录按流程知识库处理，不生成 `ai-workflow/AGENTS.md`；其规则入口由根 `AGENTS.md`、对应 `SKILL.md`、`ai-workflow/skills/INDEX.md` 与 wiki 索引承接。

## 运行模式

- 普通模式：幂等更新已有 `AGENTS.md`，优先最小修改、补齐缺失章节、修正过期事实。
- clear 模式：全量重写目标 `AGENTS.md` 正文，但不创建、覆盖或删除 `ai-workflow/memory/` 中的手写内容。
- `$init init agent clear` 只执行 `init-agent`，不补跑其它初始化项。
- `$init init tech` / `$init init tech clear` 已废弃；技术导航由本 skill 写入各子项目 `AGENTS.md`。

## 写入边界

允许写入：

- 长期有效的工程规范、目录结构、模块职责和子项目路由。
- 技术导航：模块职责表、关键入口、常见 `rg` / `find` 下钻命令、代码落位边界。
- 仓库中真实存在且可执行的命令。
- Git、提交、配置、安全和敏感信息处理等稳定约定。
- 自动生成的根目录或代码子项目级 `AGENTS.md`。

禁止写入：

- 临时任务状态、待办、一次性方案、会议结论。
- 个人日程、个人偏好；这类内容如需保留，应由用户写入 `ai-workflow/memory/LOCAL.md`。
- 密钥、令牌、账号、连接串等敏感值。
- 与仓库实际不符的示例命令、技术栈或目录职责。
- 接口清单、表结构清单、字段字典、枚举全量清单、全量文件清单或一次性技术分析。
- 默认生成或刷新 `ai-workflow/wiki/<project-domain>/tech/*`。
- `ai-workflow/memory/` 中已有的手写内容。

## 项目类型识别

先识别仓库类型，再决定采集范围与输出层级：

- 前端：`package.json`、`tsconfig.json`、`eslint.config.*`、`src/app`、`src/components`、`src/api` 等。
- 移动端：`app.config.*`、`expo-router`、`android/`、`ios/`、`src/app`、`src/components`、`src/api` 等。
- 后端：根或模块 `pom.xml`、`src/main/java`、`src/main/resources`、`application*.yml|yaml`、`logback-spring.xml` 等。
- 流程：`ai-workflow/sdd`、`ai-workflow/skills`、`ai-workflow/wiki`、`.codex/skills` 等。
- 混合：同时命中两个及以上项目特征，或根目录存在多个可识别代码子项目；常见命名包括 `web/`、`app/`、`server/`，但不得以固定名称作为唯一依据。

无法判断时，只输出已验证事实，并标注待确认项。

## 采集策略

1. 扫描根目录和核心子目录，确认仓库类型与子项目边界。
2. 查看近期提交风格：`git log --oneline -n 20`。
3. 前端/移动端读取 `package.json`、`tsconfig.json`、lint/format 配置和关键目录。
4. 移动端额外读取 `app.config.*`、环境配置、`android/`、`ios/`。
5. 后端读取根/模块 `pom.xml`、`src/main/java`、`src/main/resources`、`src/test`、`application*.yml|yaml`、`logback-spring.xml`、部署或 docker 目录。
6. 流程项目读取 `ai-workflow/sdd`、`ai-workflow/skills`、`ai-workflow/wiki`、`.codex/skills` 的索引与目录职责。
7. 采集代码子项目的技术导航事实：
   - 前端、移动端、小程序：扫描 `src/*` 顶层模块，排除 `assets`，只记录模块职责、关键入口和下钻命令。
   - 后端：读取 Maven modules，按模块记录职责、关键入口和下钻命令。
8. 只在能从代码、配置、目录结构确认时写模块职责；职责不明时标注“当前未见实现/待确认”。

## 写入策略

- 纯前端、纯移动端或纯后端仓库：默认只维护根目录 `AGENTS.md`，除非用户要求拆分。
- 混合仓库：必须维护根目录 `AGENTS.md`，并为真实存在且被识别为代码子项目的目录生成或更新子项目级 `AGENTS.md`；不得为 `ai-workflow/` 生成子级 `AGENTS.md`。
- 根目录 `AGENTS.md` 只写跨子项目长期有效规则、总览、安全、Git、子项目路由和 ai-workflow 真源说明。
- 代码子项目级 `AGENTS.md` 只写该目录内长期有效的路径、命令、配置入口和模块职责。
- 技术导航必须写入代码子项目级 `AGENTS.md`，优先融合进“项目结构与模块组织”或新增“模块职责与常见下钻”章节。
- 技术导航只保留索引级信息：模块、职责、关键入口、下钻命令和维护边界；不得展开接口字段、表字段、枚举值或文件全量明细。
- 所有生成的 `AGENTS.md` 都必须包含“Memory 入口”章节，声明执行任务前读取 `ai-workflow/memory/INDEX.md` 并按索引下钻。
- 子项目路由只列出真实存在的代码子项目；每条路由说明读取子项目 `AGENTS.md` 后仍需遵守根 memory 中适用的偏好与约定。
- 子项目命令必须标注执行目录，例如“在 `web/` 下执行 `pnpm dev`”。
- 目录树必须使用代码块展示，每个关键节点附一句作用说明；只保留协作所需节点，不穷举叶子文件。
- 可按需读取 `templates/AGENTS.md.template` 作为结构模板。

## 推荐章节

- 项目结构与模块组织。
- 模块职责与常见下钻。
- Memory 入口。
- 构建、测试与开发命令。
- 编码规范与命名约定。
- 子项目路由，混合项目根目录必选。
- 前端、移动端或后端约定按命中类型输出；ai-workflow 流程约定只写入根目录路由和对应 skill/wiki 索引，不单独生成 `ai-workflow/AGENTS.md`。
- 配置与环境、数据库与迁移、日志与监控、安全与配置提示，按实际项目输出。
- 架构概述。

## 自检

- 项目类型判断与实际文件结构一致。
- 命令来自真实 `package.json`、`pom.xml`、脚本或已有文档。
- 所有路径真实存在，或明确标注待确认。
- 没有写入敏感值、一次性任务状态或个人偏好。
- 没有覆盖、删除或合并 `ai-workflow/memory/` 中已有的手写内容。
- 所有生成的 `AGENTS.md` 都提示读取 `ai-workflow/memory/INDEX.md`。
- 混合项目根目录没有重复展开子项目细节。
- 代码子项目级 `AGENTS.md` 能独立指导该目录内开发，并在跨项目规则处回链根目录。
- 不存在 `ai-workflow/AGENTS.md`；ai-workflow 相关约束由根目录路由、对应 `SKILL.md`、`ai-workflow/skills/INDEX.md` 与 wiki 索引表达。
- 不存在新生成的 `ai-workflow/wiki/<project-domain>/tech/*` 默认技术文档，也不存在把该目录作为必读技术导航的引用。
