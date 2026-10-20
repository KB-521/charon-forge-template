# Next.js 模板实施与验证记录

> 历史验证记录：下文旧仓库链接及本机备份/临时路径仅用于溯源。当前项目为 `charon-forge-template`，发布配置见 `docs/releasing.md`。

关联方案：DES-FE-20261020-001。用户已授权按通用模板方向实施，代码与模板元数据处理完成。

用户随后指出裁剪过度，并明确要求保留 request 处理。本记录已按修正版更新：保留原工程通用能力，解除业务和公司系统耦合，不再以最小骨架为目标。

下方统计及回归记录对应请求层恢复阶段；最新 ESLint 迁移结果见文末“ESLint 配置迁移”。

## 最终内容

- 模板位置：`templates/web/nextjs`，ID `nextjs`，版本 `0.1.0`。
- 负载 41 个文件，共 228114 字节，约 223 KiB；外层元数据及维护说明 3 个文件。
- 原工程负载 4004 个文件，约 1.04 GiB，包含约 947 MiB 的 dist 产物；已整体移至仓库外备份。
- 保留 Next.js 16.2.2、React 19.2.4、TypeScript 5.1.6、Tailwind 3.4.4、Ant Design 5.24.5。
- 依赖声明由 75 项运行依赖和 24 项开发依赖精简为 11 项运行依赖和 9 项开发依赖；恢复 axios-cache-interceptor 1.5.3。
- 使用与 Ant Design 5/Next.js 16 对应的 cssinjs 1.24.0 与 nextjs-registry 1.2.0，沿用 React 19 兼容补丁。
- 请求入口恢复为 `lib/request.tsx`，使用 Axios 1.20.0，保留原函数调用方式、code/data 解包、可选 GET/POST 缓存、错误提示/回调、登录与权限回调、下载文件名及 baseURL 映射；保留 rawResponse 逃生口以接入其它协议。类名合并采用匹配 Tailwind 3 的 tailwind-merge 2.6.0。
- 从原工程恢复 DisableWrapper、TooltipTitle、SmoothMutation、NoMore；恢复 useEvent、useInit、useStateMayOutControl、useInterval、useMobile；恢复数组、颜色、复制、地址、媒体分类与二维计算工具，以及轻量国际化和通用中英文词条。
- 同步修复恢复代码中的明确问题：数组均分遇到假值时停滞、CPoint.zero 返回错误类型、定时器清理；移除事件调试日志，补齐客户端边界，替换不必要的重复类名依赖。
- 首页保持服务端组件，只将本地消息按钮与必要 Ant Design Provider 放到客户端。
- 404 提供返回首页，页面错误边界提供重试。不调用业务 API，不需要 mock，不设置全局登录/权限状态。
- projectName 显式渲染 package.json 和 README，锁文件使用 pnpm 10.18.3 在隔离工程重新生成。
- 更新根 README、templates README 与根 AGENTS 中的模板现状；没有改动 CLI/打包器行为。

## 原工程备份

完整备份位于 `/Users/king/.local/share/k-forge/backups/nextjs-20261020-qs0xkxmh/`。其中 `files/` 保留原源码、素材、锁文件和运行产物，外层 template.json、README、CHANGELOG 也已保存。备份不参与模板分发。

修正期间发现模板 files 内出现本地 node_modules，已保留移动到 `/Users/king/.local/share/k-forge/backups/nextjs-local-dependencies-50lf4fj0/`。最终源码负载不含依赖目录；临时验证副本也显式排除运行产物。

## 验证环境与结果

环境为 macOS arm64、Node.js 22.23.2、pnpm 10.18.3。通过命令级 PATH 选择已有 Node，不改变终端全局默认版本。依赖从 `https://registry.npmjs.org` 安装。

| 检查项 | 实际结果 |
| --- | --- |
| 仓库外安装及锁文件生成 | 成功，20 项直接依赖，无公司 scope 包源 |
| 模板 schema、发布文件与打包边界 | 通过，归档 42 个文件，含 template.json 和 41 个负载文件 |
| projectName 渲染及归档生成 | 通过真实 stageProject/commitProject 流程，生成名为 verify-project 的工程 |
| `pnpm install --frozen-lockfile` | 原生 verify 中通过 |
| `pnpm lint` | 原生 verify 中通过，max-warnings=0 |
| `pnpm typecheck` | 原生 verify 中通过，先执行 next typegen，支持首次构建前检查 |
| `pnpm build` | 原生 verify 中通过，使用默认 Next.js 构建器和普通服务输出 |
| 确定性打包与防污染 | 前后包摘要一致，重新生成通过 |
| 校验副本与当前模板一致性 | 逐文件字节相同 |
| 公司 SDK/品牌域名/原业务环境配置残留 | rg 扫描无命中 |
| files 中的依赖、缓存、构建及旧本地配置 | 未发现 node_modules、.next、dist、tsbuildinfo、.npmrc、旧 AGENTS |
| 空白检查 | git diff --check 通过；新文件另行检查 |
| 请求处理及恢复工具的回归 | 仓库外执行 13 组断言通过，覆盖成功解包、GET 参数、缓存、错误、鉴权、下载、原始响应、服务映射、取消、multipart 与基础工具修正 |

使用临时 Git 仓库验证已跟踪发布输入，未更改用户工作区的 Git 暂存内容：

```text
/var/folders/vn/30r7xyc53hn9mxbl63b50j780000gp/T/k-forge-nextjs-request-_r4pd8fz
```

执行原仓库 `scripts/validate-templates.ts` 和 `scripts/verify-templates.ts --template nextjs --native`，等价于在该临时仓库运行模板维护命令。实际完成输出：

```text
nextjs@0.1.0: 42 files
模板校验完成：1 个模板。
nextjs: 生成与防污染通过，原生 verify 通过
隔离验证完成：1 个模板。
```

修正版负载文件路径和内容组合的 SHA256 为 `ce5671d3fadcafb4737859e2b92b48101c2bdd2c04e5b21997af79c4ec252c2e`。这是本次记录用的源码组合摘要，不替代归档摘要。

## 交付边界

用户工作区中的模板仍为未跟踪文件，按仓库约定没有自动暂存或提交。维护者审查并纳入 Git 后，才能在当前仓库直接执行 pack/template:dev 等依赖 Git 清单的命令；此次已在临时仓库验证同一份文件。

没有启动服务器、浏览器验收或执行跨平台 CI，也没有发布 npm/Release。修正版回归脚本只在仓库外执行，完成后清理，不分发到模板；自动化测试不作为模板已有能力声明。lint、类型、构建及生成验证不能替代未来业务功能测试。

新项目参考 `templates/web/nextjs/files/README.md`；模板维护与隔离开发参考外层 README。

## ESLint 配置迁移

按用户指定改用公开包 `@kingboss666/eslint-config@1.1.1`，入口为 `eslint.config.js`，替换原 `eslint.config.mjs` 与 eslint-config-next 依赖。启用 React、TypeScript、Tailwind 规则，保留构建目录、生成声明和 Markdown 的忽略边界，增加 `pnpm lint:fix`。package.json 声明 type=module，使 .js 配置按 ESM 加载。

配置包的 React 插件要求 TypeScript `^4.9.5 || ^5.3.3`，原 5.1.6 不满足，因此调整为 5.3.3。锁文件在仓库外重新生成。源码按新配置统一格式、整理 import、补齐 JSDoc，默认请求实例改为具名变量导出，未改变请求契约或页面功能。

在 `/var/folders/vn/30r7xyc53hn9mxbl63b50j780000gp/T/k-forge-eslint-owx_bngg/project` 完成：

- 公开 npm 包源安装，TypeScript 调整后不再出现 peer 版本不匹配。
- `pnpm lint` 零错误、零警告。
- `pnpm typecheck` 通过。
- `pnpm build` 通过，首页、404 与 icon.svg 正常预渲染。

当前源码同步后，在同级 repository 临时 Git 仓库排除现有本地依赖、构建产物和 .DS_Store，执行实际维护脚本，归档为 37 个文件（template.json 加 36 个负载文件），打包校验、项目名替换、隔离生成与前后摘要检查通过。这轮隔离生成没有再次运行 native verify；上述 lint、类型检查和构建已在工程副本执行。用户工作区现有本地依赖和系统文件未改动，用户暂存区未改动。

## 环境配置恢复

按用户反馈恢复 nextConfig 的环境分支。`APP_ENV` 支持 local/test/production，ci 映射 test，prod 映射 production。未设置时按 Next 的运行模式选择 local 或 production，非法值明确报错。`NODE_ENV` 不承担部署环境选择职责。

- 新增 `.env.example`，分别使用 LOCAL_/TEST_/PRODUCTION_ 前缀配置 API 代理、CDN、图片源站与开发访问来源；未配置的代理关闭，不回退读取其它环境地址。
- 保留五分钟代理超时、本地图像非优化、线上内置图像优化、仅线上普通 console 清理及 error/warn 保留。
- 恢复 webpack 视频导入及媒体类型声明。验证发现旧规则将服务端视频文件输出到 server/chunks 内部目录，已调整 outputPath，使浏览器 URL 与 `.next/static/media` 真实文件一致。
- 增加各环境开发/构建/启动命令，cross-env 7.0.3 用于跨平台设置 APP_ENV，作为启动命令的运行依赖。build:ci 和 build:production 直接调用 CLI，避免嵌套 pnpm 命令选中其它全局版本。
- 保持普通 Next.js 服务输出到 `.next`；部署环境分别构建，修改配置后重建，启动环境与构建一致，不将 start 当作产物环境转换。

验证在仓库外 `k-forge-next-environments-16nmvlw8/project` 完成：三环境配置矩阵、别名、空代理和非法参数检查通过；lint 零警告、类型检查通过；测试和线上分别构建成功。使用不连接实际后端的 example.invalid 地址，检查生成配置及 routes-manifest，确认各自环境标记、CDN 和 API 地址独立；线上产物没有测试后端回退。测试构建还用临时视频导入页面确认公开资源落盘及 SSR URL 匹配，临时页面不分发到模板。

没有启动服务器、读取真实部署凭据或操作线上服务。配置样例通过 Next 标准 .env 加载机制或部署变量接入，部署测试与单元测试的 NODE_ENV=test/.env.test 区分处理。

## docker-config 运行时配置迁移

2026-10-20 按用户要求，从本机原工程核对 dev/prod 键值文件和部署注入方式，恢复公开运行时配置能力：

- 模板提供 `docker-config/env.dev`、`env.prod`，保留 ENV、BASE_URL 通用样例，移除真实产品地址；允许项目自行扩展公开字符串键。原工程使用带点的 `.env.dev/.env.prod`，模板使用用户所述的不带点名称，满足分发协议禁止真实 `.env*`（除 `.env.example`）的边界，未放宽框架安全规则。
- 保留 `SPRING_PROFILES_ACTIVE=dev/prod`；未设置时 APP_ENV=local/test/ci 选择 dev，production/prod 选择 prod。非法 profile、缺失文件、错误 ENV 或空 BASE_URL 明确失败。
- 不复制旧 Nginx 静态 HTML 替换脚本，使用动态 Node Route Handler `/runtime-config.js` 按请求读取文件并返回 no-store JavaScript。根布局通过 Next Script beforeInteractive 加载，只读冻结 window.CONFIG；首页和 404 仍可预渲染。Next 文件追踪显式包含两份配置。
- request 地址优先级：单次 baseURL → 显式实例 baseURL → 浏览器 CONFIG.BASE_URL → /api；服务端使用 typeof window 防护，显式实例保持可连接其它后端。
- Next 的代理/CDN/图片配置仍在构建时确定，运行时公开配置不改变它们。README 说明镜像需包含 docker-config、选择变量及两类配置的区别。

验证全部在仓库外 `k-forge-next-environments-16nmvlw8/project` 运行，未在模板负载内安装或构建：

- lint 零错误、零警告；typecheck 与生产 webpack 构建通过。
- 临时行为验证 20 项通过：profile 优先级与默认映射、字符串和引号解析、文件实时重读、脚本安全序列化、只读冻结、未暴露服务端环境、非法配置，以及请求各层地址优先级与 SSR 防护。脚本不分发到模板。
- 对同一 BUILD_ID 启动本机短时服务，4 组 profile/APP_ENV 组合均返回正确 dev/prod 地址；同一进程修改公开文件后再次读取立即生效。确认 HTML 包含 beforeInteractive 初始化队列，响应为 no-store，文件追踪同时包含 env.dev/env.prod。未进行浏览器端或实际 Docker 镜像验收，临时进程均已关闭。
- 在新的临时 Git 仓库运行实际模板校验与隔离生成脚本，44 个归档文件通过安全检查、项目名渲染、前后摘要与防污染检查。本轮未重复 --native；安装依赖复用之前隔离工程，lint/typecheck/build 已直接执行。

读取旧共享部署目录时曾有硬编码凭据出现在工具输出中，未复制这些脚本或值到模板、文档或验证脚本；交付时提醒维护者轮换。没有连接旧部署系统或操作线上服务。用户仓库未自动暂存、提交或发布。

## 移除环境样例文件

2026-10-20 按用户要求移除模板 `.env.example` 和模板 `.gitignore` 中的对应例外，README 改为说明按需创建 `.env.local` 或注入部署变量，保留构建变量说明与 docker-config 运行时配置。此前记录中的 `.env.example` 为历史验证状态。

本次仅删除样例并同步文档，使用文件存在性、模板引用扫描与 `git diff --check` 自检，未运行测试或重复构建。

## Docker 配置文件改名

按用户指定将 docker-config/env.dev、env.prod 改名为 .env.dev、.env.prod，文件内容保持不变。同步配置路由读取及错误消息、Next 文件追踪、README 与 CHANGELOG，根仓库和生成项目的 .gitignore 对两份公开文件添加精确例外。共享协议仅放行 docker-config/.env.dev、docker-config/.env.prod，根目录或其它目录的 dotenv 文件继续拒绝；贡献文档同步列出公开配置例外。上述迁移记录中的无点文件名为历史状态。

验证：新增路径边界与打包/解包回归，连同 framework、maintenance 共 15 项测试通过；根 TypeScript 检查通过。仓库外工程 lint、类型检查、生产构建通过，同一构建产物的 4 组运行环境组合和文件重读检查通过，追踪清单包含两份改名文件。临时 Git 仓库对完整模板执行校验和隔离生成通过（43 个归档文件），未重复 native 安装；未在模板 files 内运行工程、未更改用户已有其它修改、未自动暂存或提交。


## ESLint 包名迁移至 Charonix

按用户最新要求将 Next.js 模板依赖替换为 `@charonix/eslint-config@1.2.0`，配置改用默认导出 `charon`，保留 React、TypeScript、Tailwind 参数与忽略规则。同步生成工程 README、模板 CHANGELOG 和当前状态索引；上文旧包名为历史实施记录。

通过 npm registry 的元数据与 README 核对版本、默认导出调用及 ESLint peer 要求。在仓库外临时副本更新 pnpm 锁文件并回写；`pnpm install --frozen-lockfile --ignore-scripts` 与 `pnpm lint` 通过（零错误、零警告）。本次未重复类型检查或生产构建，未自动提交或发布。
