# 后端业务知识沉淀规则

将后端控制器、服务、领域模型、数据库资产中的业务事实沉淀为“索引 + 摘要层”业务文档，帮助后续任务快速定位业务链路与源码下钻入口。

## 目标

- 按业务域沉淀后端类项目业务知识到 `ai-workflow/wiki/<project-domain>/business/`。
- `<project-domain>` 来自入口 skill 的项目域发现结果；本规则不得维护固定项目名列表。
- `INDEX.md` 作为导航层，`<domain>.md` 作为摘要层。
- 关键业务结论保留少量代码证据（文件路径与行号），用于后续 `rg` 或源码下钻。
- 文档聚焦“业务意图、主流程、关键规则、边界”，不堆叠技术实现细节。
- 对无法确认的信息明确标注“待确认项”，不做主观猜测。

## 适用场景

- 新仓库首次建立后端业务知识库。
- 业务流程或规则发生变化（接口调整、领域服务重构、权限/计费变更）。
- 需要为需求评审、影响分析、测试设计提供业务上下文。

## 扫描范围（后端入口优先）

- 项目根为 `<project-root>/`，通常等于仓库一级目录 `<project-domain>/`。
- 以模块为单位扫描（优先来自 `<project-root>/pom.xml` 的 `<modules>`；无模块列表时以 `<project-root>/` 作为单模块）。
- 先判定入口模块：模块内存在 `*Endpoint`、`*Controller` 或 `*Application` 即视为入口模块。
- 对入口模块优先扫描 `src/main/java` 中的 `*Endpoint`、`*Controller`，按依赖链补充读取 service/domain/dal。
- 结合 `src/main/resources` 中配置文件补充上下文（`application*.yml|yaml`、`logback-spring.xml`）。
- 仅在需要时追踪到 `dal`/`repository`/`mapper` 层以确认业务边界。

## 文档层级（强制）

- `INDEX.md` 是导航层，只列业务域、代表入口、文档路径和核心关注。
- `<domain>.md` 是摘要层，目标长度 30-60 行，超过 80 行必须压缩。
- 每个摘要文档最多保留 5 个代表入口、5 步核心流程、5 条关键规则、5 个下钻锚点。
- 字段清单、接口参数、完整状态枚举、完整 Endpoint/Controller 清单、完整依赖链和 SQL/DAO 细节不写入业务文档。
- 扫描和覆盖校验可以全量，正文必须收敛；全量入口事实只用于确认无漏扫，不写成正文清单。

## 入口模块识别与覆盖策略（强制）

1. 识别入口模块
- 从 `<project-root>/pom.xml` 的模块列表逐个判定；无模块列表时判定 `<project-root>/`。
- 满足任一条件即判定为入口模块：
  - 存在 `src/main/java/**/*Endpoint.java` 或 `src/main/java/**/*Controller.java`。
  - 存在 `src/main/java/**/*Application.java`（优先校验是否含 `@SpringBootApplication`）。
- 模块名（如 `manager`、`admin`、`open`）仅用于阅读说明，不得作为入口模块判定依据。

2. 全量采集入口事实
- 入口候选至少包含：`src/main/java/**/endpoint/*Endpoint.java`、`src/main/java/**/controller/*Controller.java`、`src/main/java/**/*Application.java`。
- 同时匹配 `src/main/java/**/*Endpoint.java`、`src/main/java/**/*Controller.java` 防止目录命名差异漏扫。
- 对含 `Endpoint/Controller` 的入口模块必须全量采集，禁止仅抽样单个入口或单个模块。
- 对仅有 `Application` 且无 `Endpoint/Controller` 的入口模块，必须记录 `Application` 证据，并以同模块 `*Service/*Facade/*AppService` 作为业务梳理兜底入口。

3. 入口模块归域
- 每个入口模块都必须归属到至少一个业务域文档（可多个入口合并到同一业务域）。
- 每个归域条目至少包含：模块路径、代表入口文件路径、业务域文档路径、核心职责一句话说明。
- 若入口模块含 `Endpoint/Controller`，正文只列代表入口；其余入口用于覆盖校验，不写入摘要层正文。
- 若入口模块仅含 `Application`，`Application` 类路径必须出现在业务域文档代表入口中，并标注业务梳理来源。
- 若存在入口模块，`ai-workflow/wiki/<project-domain>/business/INDEX.md` 必须至少有一行业务域的代表入口包含该入口模块路径。

4. 漏扫与待补处理
- 若存在未归域入口模块或入口类，必须在执行摘要与目标文档“待确认项”中输出 `入口模块待补清单`。
- 默认先补齐再落盘；确实无法补齐时允许带待补项落盘，但必须在文档中标注待补原因。

## 输出位置

- 索引：`ai-workflow/wiki/<project-domain>/business/INDEX.md`
- 业务域文档：`ai-workflow/wiki/<project-domain>/business/<domain>.md`
- 术语表（可选）：`ai-workflow/wiki/<project-domain>/business/glossary.md`

## 模板（强制）

生成/更新业务文档时，必须基于模板文件：

- 索引模板：`ai-workflow/skills/common/init-business/templates/backend-INDEX.md.template`
- 业务域模板：`ai-workflow/skills/common/init-business/templates/backend-domain.md.template`

约束：
- 先读取模板文件，再填充实际内容。
- 后续若需改模板，仅修改模板文件，不在本规则文档内联维护模板正文。
- 更新时间使用实际生成时间，不使用占位符。
- `INDEX.md` 中的 `入口类/接口`、`文档路径` 必须使用仓库根相对路径。
- 所有入口与锚点路径必须从仓库根开始，带上 `<project-domain>/` 前缀。

## 执行步骤

1. 识别业务域
- 从 `*Controller`、`*Endpoint`、`*Facade` 入口分组业务域（按功能或模块名称归并）。
- 先按“入口模块/非入口模块”分层，再按功能归并业务域，避免入口模块遗漏。
- 若项目无控制层，以 `*Service`、`*AppService` 为入口划分业务域。
- 已有摘要层文档优先原地刷新，不因重新扫描拆出更细的新文档；仅当出现独立业务域时才新增文件。

2. 构建业务证据链
- 以业务入口为起点，追踪到 service/domain/dal 等协作层。
- 抽取核心流程步骤、关键状态变化、权限/计费/风控/校验分支条件。
- 只为关键业务结论保留代表证据：`路径:行号`；同一结论最多 2 个证据锚点。

3. 整理写入计划（非门禁）
- 在写入前或最终回复中整理“写入计划/写入摘要”，至少包含：
  - 目标文件列表与每个文件的摘要。
  - 入口模块覆盖统计（入口模块总数、`Endpoint/Controller/Application` 分布、已归域数、待补数）。
  - 若有待补：`入口模块待补清单`（模块路径 + 入口类型 + 待补原因）。
  - 关键待确认项列表。
- 本步骤不阻塞写入；除非用户明确要求只预览，否则直接继续生成/更新文档。

4. 生成/更新文档
- 更新 `ai-workflow/wiki/<project-domain>/business/INDEX.md` 的业务域索引。
- 基于 `ai-workflow/skills/common/init-business/templates/backend-domain.md.template` 生成每个业务域文档。
- 生成 INDEX 表格时，`入口类/接口` 必须转换为仓库根相对路径，并带上 `<project-domain>/` 前缀。
- 若存在入口模块：所有入口类（或 Application）必须在覆盖校验中归域；业务域正文只保留代表入口。
- 若信息无法从代码与上下文确定，写入“待确认项”。

5. 校验输出
- 关键业务规则能追溯到代表证据。
- 文档不包含敏感信息、临时任务状态、个人偏好。
- 文档只展示文件条目，不展示目录条目。
- `INDEX.md` 的 `入口类/接口`、`文档路径` 列使用仓库根相对路径，且已带上 `<project-domain>/` 前缀。
- 若存在入口模块，校验所有入口模块的入口类（或 Application）已全部归域，无漏项。
- 摘要层文档没有完整依赖清单、完整入口清单、字段参数展开或重复证据索引。
- 更新时间已刷新。

6. 若业务域为空
- 保留索引文档并标注“暂未识别业务域”。
- 不中断整体执行。

## 写作规则

- 使用事实句，避免“可能/应该”等不确定表达。
- `业务规则摘要`使用表格字段：`规则 | 摘要 | 下钻锚点`。
- API 仅描述业务用途与触发时机，不重复参数细节；参数细节通过 Endpoint/DTO/VO 源码或当前 SDD 契约精确下钻。
- 入口与下钻锚点只列代表文件，避免把依赖图搬进业务文档。

## 敏感信息处理

- 若代码或配置中出现账号、密码、token、URL 凭据，仅描述“位置与用途”，不得写入具体值。

## 幂等更新规则

- 文档已存在：覆盖更新内容（保留路径不变）。
- 文档不存在：自动创建。
- 任意重复运行不创建重复文件名。

## 质量门槛

- 输出事实必须来自真实代码与可验证上下文。
- 业务文档应支持“先定位、再下钻”，不替代源码阅读。
- 摘要越界时优先删减证据数量、入口数量和实现细节，而不是新增更细文档。
