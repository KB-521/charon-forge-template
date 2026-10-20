# Release Simplification Implementation Plan

**Goal:** 一个交互命令选择增量模板、版本及 CLI，触发可重试的统一发布。

**Architecture:** 本地与 CI 共用摘要检测和发布计划校验；固定到已推送的提交。CI 串行执行选中模板的隔离原生验证、不可变 Release、Pages 指针和可选 npm 发布。保留原底层预览脚本。

**Tech Stack:** TypeScript、Node 22、pnpm 10、Clack、GitHub CLI、GitHub Actions、npm。

用户已确认 DES-BE-20261020-001，并追加模板选择、自动检测变化和增量发布要求。本次实现不执行真实外发、不自动提交。

## Task 1 共享检测与计划

- 修改 `scripts/lib/template-pack.ts`，允许只在归档中覆盖版本，不回写模板。
- 新增 `scripts/lib/release-plan.ts`：版本归一化摘要检测、patch 建议、选中版本和历史冲突校验、完整 catalog 合并。
- 新增 `tests/release.test.ts`：覆盖新增/未变/变更、多模板选择、版本冲突和过期计划。

## Task 2 终端入口

- 新增 `scripts/release.ts`、`scripts/lib/release-github.ts`，新增 package `release` 命令。
- 检查 gh、默认分支、工作区、远端 SHA；读取正式历史；选择范围、模板与版本，确认前显示计划。
- 使用结构化 JSON 触发 workflow，并关联准确运行 ID、展示链接、等待结果。支持 `--dry-run`，取消不外发。

## Task 3 CI 发布

- 新增 `.github/workflows/release.yml` 与 `scripts/publish-release.ts`。
- 自动批次、下载全部历史，核对计划和提交；只验证/归档选中模板。
- Release 草稿上传、完整性核对、正式发布、公开下载复核，再部署 Pages；重复运行核对已有不可变资产。
- CLI 构建和包安装验证后发布 npm；相同版本内容一致则跳过，冲突拒绝。

## Task 4 文档与验证

- 更新固定源配置、README、`docs/releasing.md`、AGENTS 发布事实与本 SDD 文档。
- 在 Node 22 / pnpm 10 下执行 `pnpm typecheck`、`pnpm test`、`pnpm build`，检查格式与 YAML；真实模板原生隔离验证只做必要的一次。
- API、dispatch 和发布用 fixture/注入适配器验证，不调用外部写接口；记录一次性账号配置和未实测边界。

## npm Validating 阶段的发布完成条件

用户日志显示 npm publish 已返回成功及 provenance，但后置公开查询因 Validating 返回 404。用户明确要求“CLI 正常发好、没有报错就通过，不等待校验返回”。最终实现将 npm 命令退出码 0 作为 CI 发布成功；删除原后置轮询及曾拟增加的 10 分钟等待，不等待公开元数据或 tarball。发布前仍检查同版本内容；已相同跳过，冲突拒绝。抽取 publishCliPackage，验证提交成功后无第二次 registry 请求、命令异常透传、已有包跳过和冲突前置拒绝。
