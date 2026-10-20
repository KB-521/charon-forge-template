# Charon Forge

多技术栈项目模板仓库与 CLI 框架。当前提供 [Next.js + Ant Design 模板](templates/web/nextjs/README.md)、[Vite + React + NestJS 前后端模板](templates/fullstack/vite-nestjs/README.md)和 [Java / Spring Boot 模板](templates/server/java/README.md)。其它技术栈可由维护者继续编写或导入。

使用 Node.js 22.12+ 与 pnpm 10.18.3：

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm build
node dist/cli/index.js --help
node dist/cli/index.js --list
```

分发源已配置为本仓库 GitHub Pages 地址，首次模板发布前尚不可用。本地模板测试使用 `pnpm template:dev`；发布与安装说明见下方。

维护者日常发布只需提交、推送修改后运行：

```sh
pnpm release
```

交互选择“模板 / CLI / 全部”，自动检测变化、选择模板与版本，然后由 GitHub Actions 完成验证和增量发布。首次需配置 GitHub CLI、Pages 和 npm 发布身份，见[发布说明](docs/releasing.md)。

首次发布成功后，用户运行 `npm create charon-forge@latest` 即可进入交互安装。

常用维护入口：

| 命令                                                                                               | 用途                                                                     |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `pnpm template:import --source ../my-project --id my-template --category web --name "My template"` | 将已有工程导入基础模板，跳过依赖、缓存、构建产物、真实环境文件和协作资料 |
| `pnpm templates:validate`                                                                          | 校验描述、Git 文件清单和发布边界；空模板目录有效                         |
| `pnpm templates:pack`                                                                              | 确定性归档并输出清单/摘要；不覆盖已存在归档                              |
| `pnpm template:dev --template my-template --output ../my-template-dev`                             | 从已跟踪基础模板生成仓库外独立工程                                       |
| `pnpm verify:templates`                                                                            | 隔离生成、防污染验证；原生命令需显式 `--native`                          |
| `pnpm typecheck` / `pnpm test`                                                                     | 类型与框架行为检查                                                       |
| `pnpm verify:distribution`                                                                         | 实际 npm tarball 的仓库外安装与 CLI 检查；会联网安装运行依赖             |
| `pnpm release` / `pnpm release --dry-run`                                                          | 交互增量发布 / 只检测变化并预览                                          |

模板首次导入后，先审查 `template.json`、源码和发布文件，再将目标模板纳入 Git。框架不会自动暂存文件，不在模板基础目录安装依赖，不自动同步开发工程。

- [模板编写与导入](docs/template-contributing.md)
- [独立开发与测试](docs/template-development.md)
- [CLI 参数与失败恢复](docs/cli-usage.md)
- [分发配置与发布准备](docs/releasing.md)

根目录是唯一 CLI 工具包，`cli/src/core/` 是内部生成核心，`schemas/` 是协议事实源，`scripts/` 管理维护命令。应用模板保留各自原生结构和依赖，不加入根 workspace。

当前许可为 `UNLICENSED`；正式对外发布前由仓库维护者决定许可、确认 npm 包名及分发配置。
