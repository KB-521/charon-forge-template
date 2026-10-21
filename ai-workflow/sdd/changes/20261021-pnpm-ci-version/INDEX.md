# CI pnpm 版本来源与本机兼容范围

- 状态：Done（本地验证完成，未推送/重跑 Actions）。
- 用户输入：pnpm/action-setup@v4 无 version / packageManager 报错，询问本机 pnpm 10.x 是否必须完全相同。
- 原因：根 package.json 已无 packageManager；4 个 workflow 的 pnpm/action-setup 均未提供 with.version，engines.pnpm 不能作为该 Action 的版本来源。
- 改动：4 个 workflow 显式指定 pnpm 10.18.3。3 个 Node 模板 requirements 与现有 engines.pnpm 一致为 >=10.18.3 <11；移除 Next.js / Umi 残留 packageManager 精确固定，Vite/NestJS 原本已无该字段。CI/Docker 保留明确版本，本机使用范围内已安装版本。
- 范围说明：如 10.19.0 可通过 CLI 版本门禁；10.18.2、9.x、11.x 拒绝。未将声明扩大为全部 10.x，也不代表逐个小版本均完成应用构建。直接依赖、源锁文件、根 package.json 0.1.3 及已有根 engines 不变。
- 验证：4 个 workflow PyYAML 解析与 version 输入检查通过；pnpm typecheck 通过；pnpm test 36 项通过（新增三个实际模板的安装门禁测试，版本来自模拟 runner；覆盖最低/更新版本、过低版本、跨主版本并断言拒绝后不执行安装）；四模板校验/生成/确定性归档/防污染通过。真实暂存区未新增差异；未安装、运行于模板 files 内。
- 本次只改变配置、范围门禁和说明，未重复各应用构建；没有声称 GitHub Actions 远端执行通过。提交推送本次修复后需重新运行部署。
- Agent：implementation-executor；skill：req-dev、brainstorming。Memory、Router、Agent、skills 索引及现有 CI/模板配置已加载；无 subagent。
- 官方依据：[pnpm/action-setup v4 文档](https://github.com/pnpm/action-setup/blob/v4/README.md#version)、[pnpm 10 配置](https://pnpm.io/10.x/settings)。
