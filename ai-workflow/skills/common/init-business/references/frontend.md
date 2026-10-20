# 前端类项目业务知识沉淀规则

将页面、状态、接口中的业务事实沉淀为“索引 + 摘要层”业务文档，帮助后续任务快速定位业务链路与源码下钻入口。

## 目标

- 按业务域沉淀前端类项目业务知识到 `ai-workflow/wiki/<project-domain>/business/`。
- `<project-domain>` 来自入口 skill 的项目域发现结果；本规则不得维护固定项目名列表。
- `INDEX.md` 作为导航层，`<domain>.md` 作为摘要层。
- 关键业务结论保留少量代码证据（文件路径与行号），用于后续 `rg` 或源码下钻。
- 文档聚焦“业务意图、主流程、关键规则、边界”，不堆叠技术实现细节。
- 对无法确认的信息明确标注“待确认项”，不做主观猜测。

## 适用场景

- 新仓库首次建立前端业务知识库。
- 业务流程或规则发生变化（页面改造、状态流调整、权限变更、计费策略变更）。
- 需要为需求评审、影响分析、测试设计提供业务上下文。

## 扫描范围（排除式）

- 项目根为 `<project-root>/`，通常等于仓库一级目录 `<project-domain>/`。
- 优先扫描实际存在的入口目录与配置：
  - 应用/页面入口：`src/app`、`app`、`src/pages`、`pages`、`src/app.config.*`、`app.config.*`、`src/routes.*`、`routes.*`。
  - 业务协作目录：`src/hooks`、`src/stores`、`src/store`、`src/api`、`src/apis`、`src/components`、`src/lib`、`src/layouts`。
- 以业务入口文件为起点，按实际依赖链补充读取其它源码文件；不存在的目录直接跳过。
- 排除目录：`src/assets`。
- 排除隐藏路径：任意路径段以 `.` 开头（如 `.DS_Store`）。
- 排除构建与依赖目录：`.next`、`node_modules`、`dist`、`coverage`。

## 输出位置

- 索引：`ai-workflow/wiki/<project-domain>/business/INDEX.md`
- 业务域文档：`ai-workflow/wiki/<project-domain>/business/<domain>.md`
- 术语表（可选）：`ai-workflow/wiki/<project-domain>/business/glossary.md`

## 文档层级（强制）

- `INDEX.md` 是导航层，只列业务域、代表入口、文档路径和核心关注。
- `<domain>.md` 是摘要层，目标长度 30-60 行，超过 80 行必须压缩。
- 每个摘要文档最多保留 5 个代表入口、5 步核心流程、5 条关键规则、5 个下钻锚点。
- 字段清单、接口参数、完整状态枚举、完整组件/API/Hook 依赖链、样式细节不写入业务文档。
- 扫描可以深入，正文必须收敛；多余证据只用于校验，不写成“证据索引”或全量清单。

## 模板（强制）

生成/更新业务文档时，必须基于模板文件：

- 索引模板：`ai-workflow/skills/common/init-business/templates/INDEX.md.template`
- 业务域模板：`ai-workflow/skills/common/init-business/templates/domain.md.template`

约束：
- 先读取模板文件，再填充实际内容。
- 后续若需改模板，仅修改模板文件，不在本规则文档内联维护模板正文。
- 更新时间使用实际生成时间，不使用占位符。
- `INDEX.md` 中的 `入口路由/页面`、`文档路径` 必须使用仓库根相对路径。
- 所有入口与锚点路径必须从仓库根开始，带上 `<project-domain>/` 前缀。

## 执行步骤

1. 识别业务域
- 从实际存在的入口中识别业务域：
  - 路由型入口：`src/app/**/page.*`、`app/**/page.*`、`src/app/routes.*`、`routes.*`。
  - 页面型入口：`src/pages/**/*.{ts,tsx,js,jsx}`、`pages/**/*.{ts,tsx,js,jsx}`。
  - 配置型入口：`src/app.config.*`、`app.config.*` 中声明的页面与分包。
- 结合页面用途与导航分组划分 domain（如 `home`、`account`、`permission`）。
- 已有摘要层文档优先原地刷新，不因重新扫描拆出更细的新文档；仅当出现独立业务域时才新增文件。

2. 构建业务证据链
- 以业务入口为起点，追踪到 hooks/stores/api/components。
- 抽取核心流程步骤、关键状态变化、权限/登录/计费/分支条件。
- 只为关键业务结论保留代表证据：`路径:行号`；同一结论最多 2 个证据锚点。

3. 生成/更新文档
- 更新 `ai-workflow/wiki/<project-domain>/business/INDEX.md` 的业务域索引。
- 根据 `ai-workflow/skills/common/init-business/templates/domain.md.template` 模板为每个 domain 生成单文档。
- 生成 INDEX 表格时，`入口路由/页面` 必须转换为仓库根相对路径，并带上 `<project-domain>/` 前缀。
- 若信息无法从代码与上下文确定，写入“待确认项”。

4. 校验输出
- 关键业务规则能追溯到代表证据。
- 文档不包含敏感信息、临时任务状态、个人偏好。
- 文档只展示文件条目，不展示目录条目。
- 文档不包含任意 `.` 开头路径的隐藏文件条目。
- `INDEX.md` 的 `入口路由/页面`、`文档路径` 列使用仓库根相对路径，且已带上 `<project-domain>/` 前缀。
- 摘要层文档没有完整依赖清单、完整入口清单、字段参数展开或重复证据索引。
- 更新时间已刷新。

5. 若业务域为空
- 保留索引文档并标注“暂未识别业务域”。
- 不中断整体执行。

## 写作规则

- 使用事实句，避免“可能/应该”等不确定表达。
- `业务规则摘要`使用表格字段：`规则 | 摘要 | 下钻锚点`。
- API 仅描述业务用途与触发时机，不重复参数细节；参数细节通过接口源码、API client 或当前 SDD 契约精确下钻。
- 入口与下钻锚点只列代表文件，避免把依赖图搬进业务文档。

## 幂等更新规则

- 文档已存在：覆盖更新内容（保留路径不变）。
- 文档不存在：自动创建。
- 任意重复运行不创建重复文件名。

## 质量门槛

- 输出事实必须来自真实代码与可验证上下文。
- 业务文档应支持“先定位、再下钻”，不替代源码阅读。
- 摘要越界时优先删减证据数量、入口数量和实现细节，而不是新增更细文档。
