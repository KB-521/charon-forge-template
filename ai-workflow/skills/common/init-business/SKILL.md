---
name: init-business
description: 按仓库项目域生成“索引 + 摘要层”业务知识文档；支持 clear 模式覆盖重建目标业务文档
version: 1.4.0
owners:
  - dachui
  - sunwencong
---

# 初始化业务知识沉淀（入口）

本文件作为统一入口，负责发现项目域并选择扫描画像；具体沉淀规则拆分在以下文档中：

- `references/frontend.md` - 前端类项目业务知识沉淀规则
- `references/backend.md` - 后端类项目业务知识沉淀规则

## 产物结构

- `business/INDEX.md` 是导航层，只回答“有哪些业务域、从哪里下钻”。
- `business/*.md` 是摘要层，只沉淀业务目标、核心流程、关键规则和少量源码锚点。
- 字段、参数、枚举、完整入口清单、实现分支和依赖细节不写入业务文档正文；需要时通过 `rg` 或证据锚点下钻源码。

## 项目域发现规则

1. 若用户输入或当前任务范围包含仓库根相对路径，取路径第一段作为候选项目域，例如 `<project-domain>/...`。
2. 若用户未指定项目域，扫描仓库根目录下的一级代码项目目录：
   - 目录名不得以 `.` 开头。
   - 排除流程与资料目录，例如 `ai-workflow/`、`docs/`、`todos/`、构建产物和依赖目录。
   - 满足任一事实即可进入候选：存在 `AGENTS.md`、`package.json`、`pom.xml`、`build.gradle*`、`src/`、`app.config.*`、`project.config.json`。
   - 若根 `AGENTS.md` 的项目结构列出了一级代码目录，优先按该顺序执行；否则按目录名排序。
3. 项目域名称始终使用一级目录名本身；新增项目目录后不需要修改本 skill 的项目名列表。

## 项目画像分类

对每个候选项目域读取最小必要事实后分类：

- 前端类：存在 `package.json`，且出现页面/路由入口或前端框架事实，例如 `src/app`、`src/pages`、`app.config.*`、`src/app.config.*`、`next.config.*`、`vite.config.*`、React、React Native、Expo、Taro 等。
- 后端类：存在 `pom.xml`、`build.gradle*`、`src/main/java`，或源码中存在 `*Endpoint`、`*Controller`、`*Application`。
- 未识别：保留在执行摘要中说明跳过原因，不生成业务文档。
- 同一项目域同时命中多个画像时，按命中的画像分别执行；输出仍落在同一个 `ai-workflow/wiki/<project-domain>/business/` 下，避免跨项目覆盖。

## 路由规则

1. 先按“项目域发现规则”确定本次命中的项目域集合。
2. 再按“项目画像分类”选择规则文档：
   - 前端类项目读取 `references/frontend.md`。
   - 后端类项目读取 `references/backend.md`。
3. 用户只指定画像（如“前端”“后端”“接口”“页面”）但未指定项目域时，先发现全部项目域，再仅执行匹配该画像的项目域。
4. 本入口只负责发现、分类与路由，不在此处重复维护前后端的具体扫描、模板和校验规则；规则变更应落到对应引用文档中。

## 项目域输出规则（强制）

- 新生成或刷新的业务知识必须写入 `ai-workflow/wiki/<project-domain>/business/`。
- `<project-domain>` 必须来自项目域发现结果，不得在规则中维护固定项目名映射。
- 跨项目通用内容仅在用户明确要求时写入 `ai-workflow/wiki/global/business/`。
- 不得把根层旧式业务目录作为新生成默认目标。

## clear 模式

- 普通模式：按当前规则增量刷新命中项目域的业务文档。
- clear 模式：覆盖重建命中项目域的 `business/INDEX.md` 与相关 `business/*.md`。
- clear 不改变项目域发现规则；若用户未指定项目域，则覆盖重建所有已发现且画像匹配的项目域。

## 执行要求

1. 若用户已明确指定项目域，仅处理该项目域；若指定多个项目域，按项目发现顺序处理。
2. 若用户仅指定画像范围，仅处理发现结果中匹配该画像的项目域。
3. 若用户未指定范围，处理所有已发现且可分类的代码项目域；缺失业务事实的项目域保留空索引并标注“暂未识别业务域”。
4. 每个项目域独立写入 `ai-workflow/wiki/<project-domain>/business/`，不能让后一个项目域覆盖前一个项目域的有效内容。
5. 后续所有 `init-business` 变更都只维护本入口及其 `references/`、`templates/` 下文件，不再保留其它平行规则实现。
