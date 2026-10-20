# 实现与验证记录

> 历史验证记录：下文旧仓库链接及本机备份/临时路径仅用于溯源。当前项目为 `charon-forge-template`，发布配置见 `docs/releasing.md`。

2026-10-20；Agent：implementation-executor；skills：req-dev、writing-plans。

## 实现

- `pnpm release` 读取全部正式历史，计算模板版本归一化的实际归档摘要；交互选择范围、模板与发布版本，展示提交和版本后确认触发 `release.yml`，跟踪唯一请求的运行结果。
- 本地检查默认分支、干净工作区和远端 SHA。发布计划包含内容摘要及历史基线，CI 拒绝过期选择、同版本覆盖或与目标提交不符的计划。
- CI 只对选中模板做原生隔离验证、归档和上传；完整 catalog 保留未选模板、旧版本、URL 和摘要。版本仅作用于归档，不自动回写源码。
- 草稿补齐并下载核验后正式发布，公开下载核对通过后部署 Pages，再检查公开指针和模板下载。重跑保留不可变附件，已存在内容相同则跳过，冲突报错。旧正式批次重跑使用最新正式 catalog 作为指针，避免回退入口。
- CLI 发布前先做实际 npm 包隔离安装检查，并检查版本冲突；相同版本内容一致跳过，内容不一致要求维护者提升版本。配置固定 Pages 下载源，保留旧预览 workflows 与底层脚本。

## 实际验证

本机 Node 22.23.2、pnpm 10.18.3：

- `pnpm typecheck`、`pnpm build` 通过。
- `pnpm test`：20 项通过，含 6 项新增发布行为测试。覆盖首次/未变/内容变更、只改版本、多模板选择与历史保留、过期计划、重复版本、部分草稿恢复、正式附件不可覆盖、npm 包内容比较和准确 dispatch 关联；API 和上传使用 fixture，无真实外部写入。
- `pnpm verify:templates --template nextjs --template-version 0.1.1 --native` 通过。锁定安装、lint、类型检查、生产构建、生成和前后摘要防污染均在仓库外执行；源码版本未回写。
- `pnpm verify:distribution` 通过：实际 tarball 包含 3 个发布文件，仓库外安装、版本、帮助正常。已配置源时不把空列表检测算作通过项；远程公开链路由发布 workflow 检查。
- `pnpm release --help` 通过；空历史目录的离线 `--dry-run --history` 正确显示 nextjs 首次发布，不修改版本或触发 workflow。
- 新 workflow 的 YAML 已解析；`git diff --check` 通过。

## 外部验收边界

本机 `gh` 未安装，未登录账号、触发真实 workflow、启用 Pages、创建 GitHub Release 或发布 npm。未实际验证 GitHub OIDC、npm 账号权限或远端 CDN 生效；第一次真实外发仍需根据 `docs/releasing.md` 完成一次性配置，并核对 Actions 结果。Windows/Linux runner 未在本轮本机验证。

正式 workflow 为受信任默认分支提供写权限，不自动跟随未提交或未推送的修改。若上一个草稿尚未发布时已有更新的正式批次，旧运行拒绝继续发布，需重新运行交互入口按最新历史生成计划。

用户原有 SDD 索引与设计草稿得到保留和补充。没有自动暂存、提交或发布；`ai-workflow/memory/LOCAL.md` 未修改或纳入暂存。

## 首次 Actions 失败与跨平台比较修复

用户在提交 c48ec56482df94cf687d5a78d9c237e243d1866a 上触发 [运行 39366995999](https://github.com/KB-521/k-forge-template/actions/runs/39366995999)。类型检查、当时的 20 项测试及 CLI 包隔离安装通过，但 prepare 在校验 nextjs 选择时提示“模板或发布历史已变化”。本次没有进入附件上传、Pages 或 npm 发布阶段；读取 Release 列表为空。

定位：本地文件字节与 Git 索引完全一致，重新计算的压缩包摘要与原计划一致。gzip 输出包含操作系统标记，本机为 19，Linux 为 3；使用压缩包 SHA 比较源码，会将相同内容在不同平台的打包误判为变更。此行为来自旧实现，不是用户修改了模板。

修复：`packTemplate` 额外返回解压后确定性 tar 内容摘要，发布计划和变化检测使用该摘要。与历史版本比较时先核验下载包的原始 SHA-256，再比较解压内容；消费者 catalog 和下载完整性校验仍保留原始压缩包 SHA，不降低历史包验证。历史包由可信源下载并复用摘要缓存；离线预览需提供对应已发布归档。

验证：Node 22.23.2 / pnpm 10.18.3 下 `pnpm typecheck`、全部 21 项测试、nextjs 隔离生成与防污染检查通过，`git diff --check` 通过。新增回归验证不同 OS 标记和压缩级别的包不会误报变化，真实文件变更仍拒绝旧计划，历史包篡改仍失败。本次未重复模板原生构建，也未重新触发发布。

首次配置检查：Pages API 返回 404；仓库和 github-pages 环境的 secret 名称列表均为空，npm create-k-forge 包元数据也为 404。Pages 与首次 npm 发布身份仍需配置；未读取、生成或写入密钥。GitHub CLI 此时已由用户登录。

这次修复需提交并推送后重新执行 `pnpm release`，生成使用内容摘要的新计划；旧运行的 Re-run 仍运行原提交，不能获得修复。

## Pages 启用与发行续跑

用户在提交 bd5a17541a7b1853f6bca4ea39b6ae37f66850f8 上确认“全部”并触发 [运行 39367907103](https://github.com/KB-521/k-forge-template/actions/runs/39367907103)。首次尝试已发布并公开校验 nextjs@0.1.0 附件，随后 configure-pages 因尚未启用站点返回 404。

在已确认发行范围内修复仓库配置：先核对当前账号具备本仓库 admin 权限且站点不存在，再通过 Pages API 创建 build_type=workflow 的站点。读取确认构建类型为 workflow、站点地址为 https://kb-521.github.io/k-forge-template/，随后续跑该运行的失败 job，未创建新批次或覆盖已有附件。

第 2 次尝试中，原有不可变附件核对、configure-pages、上传 Pages artifact、部署 Pages、公开指针与选中模板下载均通过。curl 检查 stable-v1.json 返回 HTTP 200，本机 `node dist/cli/index.js --list` 成功输出 nextjs 0.1.0 / Next.js + Ant Design。

剩余阻塞为 npm 身份：Publish CLI when changed 报 ENEEDAUTH，日志中该步骤 NODE_AUTH_TOKEN 为空；仓库和 github-pages 环境的 secret 名称列表均未发现 NPM_TOKEN。CLI 尚未发布到 npm。需要维护者在 GitHub Secrets 中配置有直接发布权限的 npm 凭据，再重跑同一失败 job；未读取、生成或写入凭据，未自动提交源码。

## npm token 已配置后的 EOTP

用户后续配置了 NPM_TOKEN；只读取 secret 名称列表确认存在，未读取其值。运行第 3 次尝试的失败日志显示 NODE_AUTH_TOKEN 已被掩码处理，发布报 EOTP / requires a one-time password，说明当前发布仍需交互二次验证。另一次重试已由用户触发；本轮未再次触发发布。

补齐发布说明遗漏：CI 直接发布 token 需要 Read and write (publish and stage)，并处理 npm 默认关闭的 Bypass two-factor authentication 选项。未能从 GitHub 确认 token 的 npm 端设置，未将“未勾选”当作已验证事实。若账号或包策略不允许非交互 token 发布，使用本机交互式首发及后续 Trusted Publisher 路径。依据当前 npm token 文档和 GitHub 官方 2026-07-31 公告核对，未建议关闭账号 2FA。

进一步读取第 4 次尝试发现：它在 deploy-pages 阶段报 Multiple artifacts named github-pages，尚未执行 npm 发布。运行中确有两个同名 Pages 临时 artifact，分别来自第 3、4 次尝试；这是默认 artifact 名称无法区分重试导致的独立缺陷。

修复 `.github/workflows/release.yml`：upload-pages-artifact 的 name 与 deploy-pages 的 artifact_name 统一使用 github-pages-${{ github.run_id }}-${{ github.run_attempt }}。依据两个官方 action 的 action.yml 核对输入名；YAML 解析和上传/部署名称一致性、不同 attempt 唯一性检查通过，git diff --check 通过。未删除远端 artifact、未再次触发发布、未新增/修改凭据。未改应用代码或执行应用构建测试；新 workflow 仍待提交后远端验证。


## 依据弃用公告迁移至 OIDC

用户指出 2026-07-08 官方 npm 弃用公告。核对后修正此前把 bypass-2FA token 作为主要解决路径的建议：公告预计于 2027 年 1 月限制 token 直接发布，推荐 Trusted Publisher（OIDC）或人工批准的 staged publishing。不能据此认定当前所有账号均已禁止 bypass，也未确认此账号 EOTP 的具体 npm 策略。

正式 workflow 不再绑定 secrets.NPM_TOKEN，发布步骤将 NODE_AUTH_TOKEN 置空，保留已有 id-token: write、GitHub-hosted runner、Node 22 和 npm 11.21.0。文档改为本机交互首次发布、随后绑定 npm Trusted Publisher；明确仓库、workflow filename、github-pages 环境和允许直接 npm publish，说明相同版本跳过不能证明 OIDC 发布已验证。

验证：Node 22.23.2 / pnpm 10.18.3 下 pnpm build 成功；npm pack --ignore-scripts --json --pack-destination dist 生成 dist/create-k-forge-0.1.0.tgz，仅含 README.md、dist/cli/index.js、package.json 三个文件。YAML 解析、OIDC 权限、空 token、Pages 上传/部署 artifact 一致性检查和 git diff --check 通过。此次只改 workflow 与说明，未改 CLI 实现或重复执行框架测试。

未登录 npm、未执行真实 npm publish、未变更或删除任何凭据、未自动提交推送或触发 Actions。首发的浏览器/2FA 授权及 npm 网站 Trusted Publisher 配置需由账号持有人完成；实际 OIDC 端到端发布尚待验证。


## CLI 更名为 Charon Forge

2026-10-20 按用户要求将项目品牌 K Forge 改为 Charon Forge，npm 包和 bin 改为 `create-charon-forge`，消费者命令改为 `npm create charon-forge@latest`，保留用户已调整的版本 0.1.1。同步 CLI 帮助、发布提示、隔离分发验证脚本、临时目录前缀、缓存目录、生成记录/中断标记及其保留名称与测试断言，更新当前 README 和使用/发布文档。新生成记录为 `.charon-forge.json`，缓存为 `.cache/charon-forge`；不自动迁移旧缓存或已有生成项目。

该轮仅迁移 CLI 品牌；当前仓库与目录迁移配置以 docs/releasing.md 为准。

验证：`pnpm typecheck`、`pnpm build`、全部 24 项 `pnpm test` 通过；构建后 CLI 帮助显示新命令。`npm pack --ignore-scripts --pack-destination dist` 生成 `dist/create-charon-forge-0.1.1.tgz`，只包含 README.md、dist/cli/index.js、package.json。`git diff --check` 通过。未自动提交、推送或发布，未检查新 npm 包名的注册可用性。


## 新仓库与本地目录迁移

按用户追加要求，当前项目统一为 `charon-forge-template`：本地目录 `/Users/king/Desktop/charon-forge-template`、origin `https://github.com/KB-521/charon-forge-template.git`、package.json repository、Pages channelUrl 及 Trusted Publisher Repository 均同步。设计文档中的命令和路径示例同步新名称，历史验证链接及仓库外备份路径保留并明确标注为历史记录。

继续任务时发现原目录已无 .git，故未迁移旧 Git 历史；在新目录初始化 main 分支并配置 origin，未暂存、提交或推送。新 GitHub 仓库由用户自行创建；需重新启用 Pages、发布模板及绑定 npm Trusted Publisher。构建、迁移后类型检查与 npm 打包通过，新 tarball 为 dist/create-charon-forge-0.1.1.tgz。上一轮 24 项测试已通过，本轮仅迁移路径与配置，不重复测试。

## npm Validating 阶段：以 CLI 退出码通过

用户日志显示 create-charon-forge@0.1.2 的 npm publish 返回 0、生成 OIDC provenance 并提示包正在 processing，随后原脚本在约 25 秒的公开轮询窗口后失败。用户补充 npm 页面有 Validating，随后明确要求：CLI 正常发好且没有报错就通过，不等待后续校验返回。此要求替代先前拟增加的 10 分钟等待。

最终修改 scripts/lib/release-publisher.ts 与 scripts/publish-release.ts：publishCliPackage 先保留 cliPublishStatus 的同版本内容检查；已公开且内容相同直接跳过，冲突拒绝；需要发布时只调用一次 npm publish，并以命令成功返回为 submitted。删除全部发布后 registry/tarball 查询与等待。npm 命令异常继续使发布失败。日志写明“成功提交、发布步骤通过、npm 后续校验异步处理”，没有宣称公开可见或验证完成。不增加长期 token、跳过 npm 自身校验或提升版本。

验证：pnpm typecheck 通过；`pnpm exec tsx --test tests/npm-publication.test.ts tests/release.test.ts` 11 项通过，新增 4 项覆盖：registry 一直 404 但 npm 成功后仍通过且只有一次前置查询；npm 命令错误原样失败；已有相同包不调用 publish；内容冲突在 publish 前拒绝。测试使用内存 fetch/命令 fixture，没有真实 npm publish。git diff --check 通过。

官方 [npm Registry API](https://api-docs.npmjs.com/) 将生命周期与公开元数据分开；status 示例包括 validating，精确状态需维护者权限。本次只读公开 0.1.2 查询返回 404，不能由此判定异步验证失败。最终实现按用户要求不查询该生命周期状态。

本次仅修改维护脚本和说明，CLI 包文件未变，未发布、重跑 Actions、提交或推送。远端 npm 的后续结果由 npm 异步处理，未声称已核验。根 build/分发和 Java 原生测试与本次无关，没有重复执行。

Agent：implementation-executor；skill：req-dev。按 Memory → Router → Agent → skills 索引/现有发布上下文执行，无额外技能或 worker。
