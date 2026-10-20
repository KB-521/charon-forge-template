# 发布

日常发布在仓库根目录运行：

```sh
pnpm release
```

按提示选择“模板 / CLI / 全部”，勾选模板和版本，核对摘要后确认。命令会触发 GitHub Actions、显示运行链接并等待结果。发布必须来自已提交、已推送的默认分支，不会自动提交或推送你的修改。

## 新仓库迁移

项目目录和 GitHub 仓库统一为 `charon-forge-template`，npm 包为 `create-charon-forge`。在 GitHub 创建 `KB-521/charon-forge-template` 空仓库后，检查本地 origin，审查文件并提交，再推送 main 分支。

新仓库按下节重新启用 Pages、绑定 npm Trusted Publisher。旧仓库的 Release 与 Pages 不会自动迁移；首次运行 `pnpm release` 选择“全部”，重新发布模板并部署下载入口后再发布 CLI。

## 首次配置

只需配置一次：

1. 安装 [GitHub CLI](https://cli.github.com/)，执行 `gh auth login`，账号需有本仓库 Actions 写权限；macOS 可执行 `brew install gh`。
2. 将本实现推送到 GitHub 默认分支，使 `.github/workflows/release.yml` 可用。在仓库 Settings → Pages 中将 Source 设置为 **GitHub Actions**，允许 `github-pages` environment 从默认分支部署。
3. 核定 npm 包名 `create-charon-forge` 的使用权与许可。当前许可仍为 `UNLICENSED`；本次实现未替维护者选择许可。
4. npm 使用 **Trusted Publisher（OIDC）**，正式 workflow 不再读取 `NPM_TOKEN`。首次新包先按下节在本机交互发布，再在 npm 包设置中绑定 GitHub Actions。

### 首次 npm 发布（仅一次）

在仓库根目录执行，登录和发布时按浏览器提示完成账号验证：

```sh
pnpm build
npm pack --ignore-scripts --pack-destination dist
npm login --registry=https://registry.npmjs.org
npm publish ./dist/create-charon-forge-0.1.1.tgz --ignore-scripts --access public --registry=https://registry.npmjs.org
```

以上文件名对应当前 package.json 的 0.1.1；版本变更时使用实际生成的文件名。发布的是构建后的真实 tarball。首次版本已存在时不要重复发布或覆盖，先查看 `npm view create-charon-forge version --registry=https://registry.npmjs.org`。npm 审核和索引更新可能延迟，等待包可见后再继续。

打开 npm 上 `create-charon-forge` 的 Settings → Trusted Publisher，选择 GitHub Actions，填写：

| 字段 | 值 |
| --- | --- |
| Organization or user | `KB-521` |
| Repository | `charon-forge-template` |
| Workflow filename | `release.yml`（只填文件名） |
| Environment name | `github-pages` |
| Allowed actions | 启用直接 `npm publish` |

保存时可能需要账号 2FA。workflow 已具备 `id-token: write`，npm 自动交换短期发布凭据，无需创建或更新发布 token。后续可以撤销不用的 npm token，并删除 GitHub 中不用的 `NPM_TOKEN` secret。不要关闭账号 2FA。

提交并推送 workflow 修复后，后续仍使用 `pnpm release`。本机已发布且内容相同的版本会跳过，因此“跳过”不能作为 OIDC 发布通过的证据；真正验证 OIDC 需要发布一个新的 CLI 版本。新建但未验证的 Trusted Publisher 配置会过期，请按 npm 页面提示及时完成首次实际发布，过期后重新配置。

旧运行使用原提交，重跑不会获得 OIDC 修复。参考 [npm Trusted Publisher](https://docs.npmjs.com/trusted-publishers/)；[npm 弃用公告](https://github.blog/changelog/2026-07-08-npm-install-time-security-and-gat-bypass2fa-deprecation/)预计于 2027 年 1 月限制 bypass-2FA token 直接发布，本项目不再把它作为自动发布方案。

`forge.config.json` 已配置本仓库计划使用的下载入口：`https://kb-521.github.io/charon-forge-template/stable-v1.json`。只有首次模板 Release 与 Pages 部署成功后该入口才可用。迁移仓库、设置 Pages 自定义域名或调整托管方式时，需要更新此配置和可信域名并重新发布 CLI；迁移仓库还需同步 package.json 的 repository.url，与 npm Trusted Publisher 的仓库保持一致。

npm Trusted Publisher 要求 npm 11.5.1+、Node 22.14+；正式 workflow 使用 Node 22 与 npm 11.21.0。首次尚无模板发行时选择“全部”，或者先发布模板，再发布 CLI。首次账号授权、Pages 启用和 npm 身份配置不由脚本代办。

## 模板增量发布

- 扫描所有模板实际进入归档的文件，对比正式发布摘要；Git 未跟踪或不被 include 选中的文件不进入归档。已跟踪的运行产物仍拒绝发布。
- 检测时对解压后的确定性 tar 内容计算摘要，版本归一化为该模板最新已发布版本，避免版本号、gzip 操作系统头或压缩方式变化造成误判。历史归档先校验 catalog 中的压缩包 SHA-256，再参与内容比较；首次比较需下载历史包，后续复用已校验缓存。最终只为选中的模板生成发布附件和执行原生验证。
- 默认勾选新增、有变化的模板；无变化模板显示跳过。可取消暂不发布的项。
- 已手工提升版本时默认使用该版本，否则建议 patch；也可选择 minor、major 或指定版本。发布版本只写入归档的 `template.json`，不自动回写源码或创建提交；后续以正式历史继续计算版本。
- 选中模板逐个隔离执行其 verify 命令，全部通过后发布。其它模板保留原 URL、摘要与历史版本，新 catalog 仍包含完整列表。
- 只更新模板无需重新发布 CLI。CLI 使用 package.json 的版本；已发布且包内容相同则跳过，内容冲突必须先提升 CLI 版本、提交并推送，再重试。若只更新模板，请直接选择“模板”。

批次、附件 URL、首次发行判断和完整历史下载由程序处理，无需手填。新的统一 workflow 会正式外发；原 `release-templates.yml`、`release-cli.yml` 仍只生成预览。

## 预览与重试

```sh
pnpm release --dry-run
```

预览使用 GitHub 正式历史，仅显示变化，不修改版本或触发发布。离线预览可把全部正式 `catalog.json` 与各模板最新已发布归档放在同一目录，归档命名为 `<模板ID>-<版本>.tgz`，再运行：

```sh
pnpm release --dry-run --history ../catalog-history
```

空历史目录代表首次发行预览，不代表线上确实无历史。离线参数不能用于正式发布。

若因程序缺陷修复了发布代码，应提交并推送修复，再重新执行 `pnpm release`。旧 Actions 运行会继续使用原提交，直接 Re-run 不会加载新代码。

Actions 串行发布，不自动取消正在运行的发布。先上传草稿全部附件并校验，再正式发布；公开附件与摘要核对通过后部署 Pages，公开指针及选中模板下载通过校验后发布 CLI。

失败时在对应 Actions 运行选择 **Re-run failed jobs**。同一运行复用批次：相同附件跳过，部分草稿补齐，正式附件有冲突则拒绝覆盖。已发布的包不回滚。重跑旧运行时，Pages 采用全部正式历史中最新的批次，防止把入口回退到旧版本。也可以重新运行 `pnpm release`，不选新模板，仅同步现有下载入口。

Pages 临时 artifact 按 run ID 和 run attempt 唯一命名，上传与部署使用相同名称，避免同一运行重试时匹配到多个旧产物。采用默认 github-pages 名称的旧 workflow 若已发生重名，需要提交并推送修复后重新执行 `pnpm release`；模板已发布时只选择 CLI 即可。

本地命令中断后，Actions 会继续运行；用已显示的运行链接查看结果，不要立刻重复触发。若远端历史在选择后变化，CI 会拒绝过期计划，要求重新检测。

## 底层维护命令

已有 `templates:pack`、`catalog:build`、`release:prepare` 仍可用于人工预览与排查，日常发布无需逐个执行。它们沿用已跟踪输入、安全检查、不覆盖归档及正式历史合并约束。

## 用户安装

首次模板和 npm 发布成功后，用户在支持 Node 22.12+ 的交互终端运行：

```sh
npm create charon-forge@latest
```

随后选择分类、模板、目录与是否安装依赖。目标目录必须不存在；原生 SDK 和包管理器要求由所选模板决定。当前 Next.js 模板使用 pnpm 10.18.3。

本实现不代表 GitHub Pages、npm 账号或公开下载入口已经配置或发布成功。外部流程以首次实际 Actions 运行结果为准。

参考：[GitHub Pages workflow](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)、[npm Trusted Publisher](https://docs.npmjs.com/trusted-publishers/)。
