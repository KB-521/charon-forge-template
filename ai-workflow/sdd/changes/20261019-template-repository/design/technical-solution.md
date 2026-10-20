# 多技术栈模板仓库与 CLI 框架技术方案

- 方案索引ID：`DES-BE-20261019-002`
- Design Package：`template-repository-implementation`；任务短码：`KFORGE`
- Change ID：`20261019-template-repository`；日期：2026-10-19
- 状态：用户已授权框架执行；框架已实现并本机验收；实际模板由用户后续维护
- 上游：[architecture.md](architecture.md)，`DES-BE-20261019-001`
- Agent：`design-manager` / `requirement-manager`（前期设计拆分）、`implementation-executor`（本次框架实现）
- Skills：`req-dev`、`architecture-designer`、`brainstorming`、`common/task-split`（前期）；`Code`、`common/init-agent`（实现与技术导航）

## 1. 范围与上下文

用户已明确纠正首批模板假设：**本次只生成并执行框架，实际模板会在后续逐步写入或导入。** 不创建 React、Python、Java 等应用模板，不以任何真实模板的原生构建作为框架前置；测试只使用临时纯文件 fixture。

已读取 Memory INDEX/TEAM/LOCAL、根 AGENTS、技能索引、SDD 与完整上游设计。Memory 没有附加偏好，当前无业务/规则 wiki、独立 PRD、应用服务或数据库。用户此前工作区文件保留，未执行 Git 提交、npm publish、Release 创建或 Pages 部署。

实际产出为单根 CLI 包、协议、打包、catalog/下载/生成、安装适配器、模板导入和隔离开发、框架 CI、发布预览及说明。`templates/` 仅有 README；空模板目录有效。`forge.config.json` 的 channelUrl 为 null；当前 CLI 列表正常返回“暂无可用模板”。

## 2. 工程与技术取舍

根 `package.json` 是唯一包，`cli/` 不含独立 package.json，也没有根 workspace。Node 最低 22.12，pnpm 固定 10.18.3；本机使用 Node 22.23.2。依赖精确版本和解析结果见 package.json / pnpm-lock.yaml。

TypeScript 严格模式、ESM、esbuild 构建工具代码；运行依赖由根包声明，构建设置 packages:external，不受工作区祖先 Yarn PnP 配置影响。CLI 包只有 dist/cli、README、package.json，模板、scripts、schemas 源码与 ai-workflow 不进入包。

Commander/@clack 分离参数和 TTY 交互；Ajv 严格校验 draft-07；FromSchema 从生成的 schema 常量推导类型。相比维护多份类型/校验，字段只以 schemas/*.schema.json 为真源，build/typecheck 前自动生成 schemas.generated.ts。

归档使用 tar-stream 和 Node gzip：库只解析/生成格式，项目主动验证路径、条目类型、体积、渲染和污染边界；相较直接交给文件系统解包器，避免验证前写出归档条目。Node fetch 承接固定可信来源下载，semver 处理版本，picomatch 处理 publish.include。无自建 registry、数据库或后台服务。

## 3. 模块与接口

| 真实落点 | 职责 | 主要交接 |
| --- | --- | --- |
| cli/src/index.ts、commands/create.ts | 公共参数/TTY、生成编排 | runCLI(argv, version, config, network?) → exit code |
| cli/src/core/protocol/、errors.ts | schema/派生类型、语义规则、错误类别 | unknown → Template/Catalog/Channel/GenerationRecord |
| cli/src/core/distribution.ts | channel/catalog、兼容解析、下载和内容缓存 | RemoteStore.loadCatalog → Snapshot；download → 已校验归档路径 |
| cli/src/core/archive.ts | 确定性归档、安全暂存、显式渲染 | stageProject(path, digest, inputs/callback, parent, expected?, signal?) → Stage |
| cli/src/core/commit.ts | 父路径规范化、独占目标、生成记录 | canonicalTarget；commitProject(Stage, target, record, signal?) → 完整项目路径 |
| cli/src/core/install.ts | 固定 argv、工具范围、平台入口 | installArgv、toolCommand、installProject |
| scripts/lib/template-pack.ts | Git 跟踪与 include、污染和归档验证 | discoverTemplates；packTemplate → template/digest/files |
| scripts/import-template.ts | 导入原生源码、排除运行/本地文件 | 新模板目录，不自动 git add/安装/改名 |
| scripts/prepare-template-dev.ts | 本地模板复用同一生成核心 | 仓库外新工程，local-dev 来源记录 |
| scripts/lib/catalog.ts | 完整历史、不可变版本、推荐回退 | mergeCatalogs(history, batch, artifacts, baseURL, recommendations) |
| scripts/prepare-release.ts | 干净提交、归档摘要、预览一致性 | 新的 dist/release，未外发 |

Stage 包含私有暂存路径、已验证 template、规范化 inputs、路径/权限清单。Resolved 快照和摘要只解析一次；归档在下载和消费时再次校验。内部函数不是独立公开 SDK，不承诺旧草案中的不透明品牌类型或未实现的接口。

04/05 实际共用 distribution.ts，03/06 共用 archive.ts，已串行实现；旧草案中这两组任务的并行写入假设已撤销。

## 4. 协议与字段

所有协议关闭未知字段，描述/Channel/Catalog/生成记录的 schemaVersion 当前仅接受 1；PublishedVersion 元数据允许未来正整数版本，旧 CLI 跳过其不支持的模板协议并保留兼容推荐。不兼容数据失败，不加载网络 schema。完整字段见 schemas/；这里仅记录职责：

- Template：稳定 id/version、展示分类/布局/标签、minCliVersion、source=files、inputs、render、publish.include、requirements、install、verify。
- inputs：公开 string 参数；projectName 必填。值限制为小写字母开头、数字和单短横线，最多 63 位，可按模板进一步收窄。拒绝未知键、保留名、无默认值必填缺失和不合法 pattern。
- render：token → inputKey，精确 UTF-8 文件列表。只替换显式 `__TOKEN__`，不解析普通花括号、不重命名路径、不删锁文件。没有参数化需求可以声明空映射/空文件列表。
- publish.include：相对 POSIX glob、匹配点文件、非空，无反向 exclude；禁止越界或绝对路径。归档内只有 template.json 和 files/ 负载。
- requirements：tool、SemVer range、install/verify 阶段。install 为 node、python-uv 或 manual；verify argv 只在维护者显式原生验证中运行。
- Channel：schemaVersion、catalogVersion、catalogUrl、sha256。
- Catalog：templates[id].versions[exactSemVer] 保留完整历史，recommendedVersions 独立排序；键/内部 ID/版本一致，推荐引用必须存在且为稳定版本。
- PublishedVersion：展示/兼容元数据、不可变 artifactUrl 与 SHA-256；归档描述与该元数据必须一致。
- GenerationRecord：CLI/模板/快照版本和摘要、公开 inputs、createdAt。远程 source=catalog；本地 source=local-dev、catalog 信息为 null，附 sourceCommit。不记录敏感环境或用户绝对路径。

版本为完整 SemVer，无 build metadata；显式版本不静默替换。默认选择推荐列表中首个兼容 CLI 的版本，不对全部历史取最大值。

## 5. 基础模板、导入、打包和开发隔离

导入入口 `template:import --source --id --category --name` 拷贝现有原生普通文件，保留锁文件/二进制/执行位，排除依赖、缓存、构建产物、日志、真实环境文件与默认 AI 协作资料；拒绝链接与特殊文件。目标必须全新且不在来源目录内部，避免递归导入。生成最小 manual 描述，不推测工具版本、安装脚本或项目改名；用户审查后再补齐。

基础源码只在 templates/<category>/<id>/files/。template.json 及发布文件必须先手工纳入 Git；include 命中未跟踪文件报错。打包扫描所有已跟踪负载的污染，再与 include 求交集，include 不得掩盖误跟踪的运行产物。

当前禁止各层 node_modules/.next/.dart_tool/.venv/__pycache__/coverage/dist/target/build、Git 元数据、日志、LOCAL、真实 .env 和工具保留记录；`.env.example`、锁文件、合法 Wrapper/二进制可保留。确有同名基础源码目录时需修改规则和验证，不静默放宽。

归档按 UTF-8 路径排序，mtime=0、uid/gid=0、空 owner/group；普通文件 0644，Git 执行位 0755；gzip 元数据稳定。相同输入重复包的字节/摘要完全一致。写归档用 wx，不覆盖已有产物。

`template:dev` 只接受已跟踪的本地模板，在规范化后的仓库外新目录生成；父目录需存在。打包、暂存和提交复用用户生成核心，不自动安装/启动/回写。工作目录源码改动由维护者逐文件审查回写并恢复 token。Node/Python/Java/Flutter 等运行状态不进入基础模板。

`verify:templates` 在仓库外生成、比较运行前后包摘要并再次暂存验证。仅显式 --native 执行受信 verify argv，每条 5 分钟超时；实际 SDK/平台健康检查由未来模板定义，当前无真实模板原生验收。

## 6. 分发、版本和缓存

分发配置在构建时固定，无公开任意 catalog URL、本地模板、关闭摘要检查的参数。HTTP 仅为测试函数注入，不在公开命令启用。逐跳检查 HTTPS/可信主机、至多 5 次重定向。

channel ≤64 KiB，catalog ≤10 MiB，压缩包 ≤100 MiB，解压总量 ≤500 MiB，单文件 ≤100 MiB，条目 ≤20,000。单次 30 秒超时，整体至多 5 分钟；网络/408/429/5xx 额外重试两次，退避 0.5/1 秒。schema、完整性、来源错误及其他 4xx 不当作临时错误重试。

缓存位于用户目录 .cache/charon-forge，按内容摘要存放成功归档，唯一 .part 完整写入并校验后提交；并发可重复下载但不接受部分内容。每次命中重新验证摘要，坏缓存不会成功生成。channel/catalog 完整校验后缓存；仅网络不可用且缓存链路完整时进入离线，显示快照版本，缺包/坏包报 E_OFFLINE_MISS。不承诺首次安装 CLI/模板可以离线。

## 7. 安全暂存与独占提交

顺序为快照 → 已校验归档 → 私有暂存/渲染 → 独占创建目标 → 完整记录 → 可选安装。校验/渲染失败不创建目标，暂存失败只删除本工具私有目录。

解包在写文件前逐条验证：拒绝越界、绝对/UNC/盘符/反斜杠路径、链接/设备/FIFO、重复路径、Windows 保留名/非法字符、尾随空格/点，以及完整路径和隐式父目录的大小写/Unicode 拼写冲突。只接受普通文件/目录；二进制不渲染，render 文件要求 UTF-8、无 BOM/NUL，未知/缺失/未使用 token 失败。

目标父路径 realpath 规范化后操作（兼容系统 /tmp、/var 别名），开发入口按规范化路径确认在仓库外。提交前后核对父目录身份；首版不承诺抵御可任意改写同用户父目录的恶意本地进程。

mkdir 非递归独占目标，已有空/非空目录都失败；新文件 wx，子目录拒绝链接。先写 incomplete 标记，再复制已验证负载，最后独占写 .charon-forge.json 并移除标记。中断保留部分新目录和可诊断标记，不递归清理目标，不支持 force/resume。安装失败只影响安装状态，不撤回已生成工程。

## 8. 固定安装与平台边界

Node 适配器：pnpm frozen-lockfile、npm ci、yarn immutable；仅允许描述声明的工具。Python uv：sync --frozen --no-python-downloads。manual 不执行进程，使用项目说明。

只有选择安装时才检测 install requirements，按固定 executable/argv 和 cwd 调用，无 shell 拼接。Windows Node 工具优先查找已安装 JS 入口，由 process.execPath 执行；无法解析则提示手动安装，不调用不安全的 shell:true。

[Node 官方文档](https://nodejs.org/download/release/v22.23.3/docs/api/child_process.html)说明 Windows batch 文件的执行约束；本项目入口解析策略是自身实现。空格/中文/&/括号 cwd 由测试覆盖；真正 Windows/Linux runner 尚待 CI 运行，不能用本机测试代替。

## 9. CLI、错误与空目录

CLI 支持 directory、--template、--template-version、--name、可重复 --input、--package-manager、--install/--no-install、--yes、--list、--version、--help。帮助/版本不联网，list 与创建参数互斥，冲突安装参数失败。

TTY 依次收集分类/模板/目录/名称/输入/安装/摘要确认；--yes 或无 TTY 不等待交互，不猜缺失模板/目录/必填输入，默认只生成。成功显示模板/路径、安装命令和项目 README 指引。当前未配置 source 时返回有效空列表，创建给出无模板提示。

ForgeError 携带 code/stage/message/retryable。退出码：0 成功、1 内部、2 输入/目标存在、3 网络/离线缓存缺失、4 协议/兼容/完整性/归档/渲染、5 写入/未完成、6 工具/安装、130 取消。默认输出不序列化环境、凭据、底层 cause 或调用栈。

## 10. 真实模板由用户后续维护

原 KFORGE-11/12/16–20 全部 Deferred。没有首批 React/Python 假设，没有 Next/Nest/Java/Flutter/Agent 模板源码，也没有占位模板混入生产目录。用户后续可以手工维护目录或用 template:import 导入已有项目，补齐描述/锁文件/原生命令，纳入 Git 后生成独立开发工程。

真实技术栈的 SDK、平台承诺、依赖版本和原生验收在导入时确定，不写入本次完成证据。monorepo 仍须真实组合需求触发，不建立空 workspace、共享包或自由组合引擎。

## 11. CI、历史合并与发布预览

validate.yml 配置 Node 22/24 × macOS/Linux/Windows，执行锁定安装、typecheck、build、测试、空模板校验、隔离验证与实际包检查；contents:read，无 PR 发布写权限。当前通过的是本机 Node 22；远端矩阵未运行。

mergeCatalogs 合并所有正式历史，不只读 stable；同版本描述/摘要冲突即失败，一致版本复用历史 URL。后续批次保留全部 versions，仅以 recommendedVersions 改变默认值；支持推荐回退。历史按自然批次顺序处理。

release:prepare 要求干净已提交工作区、完整 history 或显式 first-release、非空真实模板、不可替换版本和归档摘要；输出新目录中的归档/catalog/channel 预览，不覆盖已有目录。模板 workflow 分页读取所有正式 templates-* catalog，缺失历史失败，不把空历史当成正常首发。

release-templates.yml 和 release-cli.yml 仅手动执行发布准备并上传 artifact，均只读仓库，没有 Release 创建、Pages 部署或 npm publish。线上事务待真实模板/托管建立后接入：草稿附件齐备 → 发布不可变 Release → 公开回读摘要 → 最后更新 channel。该顺序参考 [GitHub immutable releases](https://docs.github.com/en/code-security/concepts/supply-chain-security/immutable-releases)，并发串行化语义参考 [Actions concurrency](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency)。这不是本次已运行的线上行为。

CLI npm 包只有必要文件，verify:distribution 实际打包并在仓库外安装，检查 bin、版本、帮助和空列表。远程创建路径通过同一 runCLI 注入 HTTP fixture 验证，没有把 fixture 当成已发布模板。npm initializer 入口语义参考 [npm init](https://docs.npmjs.com/cli/v11/commands/npm-init/)。

## 12. 决策记录

- ADR-006（Implemented）：JSON Schema 为字段真源，生成常量和类型；比重复手写校验/接口减少漂移，代价是构建前生成一步。
- ADR-007（按用户指示替换）：框架优先，真实模板后续由用户逐步导入；撤销原两模板首发方案。以临时纯文件 fixture 验证引擎，代价是不能声称任何真实 SDK/应用已经构建通过。
- ADR-008（Implemented）：安全暂存与独占目录提交分离；可独立验证恶意归档与竞争目标；代价是整体目录不原子出现，中断需要人工检查残留。
- ADR-009（框架阶段）：CI/发布预览先行，线上发行后接；不虚构 owner、许可、公开 URL 或凭据。相比直接建立未配置的自动发布，当前产物可本地验证和审查，后续仍需接入真实托管。

## 13. 任务与交接

[任务入口](../tasks/INDEX.md)：保留原 20 项追溯，其中 13 项框架 Implemented，7 项实际模板 Deferred；本次框架范围 13/13 已落盘并本机验收。

| 父需求 | 本次范围 | 状态 |
| --- | --- | --- |
| REQ-KFORGE-FOUNDATION | 工程、协议、打包 3 项 | Implemented |
| REQ-KFORGE-ENGINE | catalog/下载/暂存/提交/安装/CLI/导入开发 7 项 | Implemented |
| REQ-KFORGE-LAUNCH | CI、发布预览、文档 3 项；原两模板延期 | Implemented；2 项 Deferred |
| REQ-KFORGE-STACKS | 五栈实际模板 | Deferred，用户后续维护 |

没有启动 subagent/worktree，没有提交工作区。实际文件与命令已同步根 AGENTS，未改写 Memory。

## 14. 验证证据与限制

本机 Node 22.23.2、pnpm 10.18.3：

- install --frozen-lockfile、typecheck、build 通过。
- 13 项测试通过：协议/输入、确定性归档、污染与 Git 跟踪、安全解包/隐式目录冲突、token/取消清理、目录竞争/中断、安装固定参数与保留工程、catalog 历史/回退、HTTP 创建/缓存/重试/离线、真实源码导入和仓库外开发。
- templates:validate、verify:templates、templates:pack 在空模板仓库通过；catalog:build --dry-run 生成有效空目录。
- verify:distribution 对真实 npm tarball 执行仓库外安装，发布清单 3 个文件，bin/版本/帮助/空列表可用；没有使用根 node_modules 作为消费工程依赖。
- 格式、Git 空白、SDD 相对链接/任务状态与队列同步另做最终检查。

未运行真实应用 SDK 构建、GitHub runner 矩阵或正式外发；这三项不在本次框架范围。具体版本见锁文件；UNLICENSED 与未配置分发源应在正式外发前由维护者确定。
