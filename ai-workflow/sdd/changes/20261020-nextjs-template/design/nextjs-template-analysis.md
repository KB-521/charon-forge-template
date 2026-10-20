# Next.js 真实项目模板化代码梳理与裁剪建议

- 方案索引ID：DES-FE-20261020-001。
- 范围：`templates/web/nextjs`，以下源码路径均相对于其 `files/`。
- 状态：用户于 2026-10-20 回复“好 你来处理吧”，已按推荐方向授权进入实现。以下保留原始梳理事实与候选清单，最终留存范围见实施计划及验证记录。

后续范围纠正：用户指出删除过多，明确 request 处理可以保留。最小骨架方案已被纠正，保留原工程通用能力，以解除业务耦合为准。已恢复的具体能力及验证见 [验证记录](../validation.md)；下方初次裁剪候选不再作为整目录删除的依据。

配置范围继续纠正：保留本地、测试、线上环境分支和对应构建/启动命令，API 代理、资源前缀、图片白名单、超时、日志及视频导入按通用能力处理。nextConfig 不再仅保留 strictMode，实际配置与验证见验证记录的环境恢复部分。

## 1. 概览

建议将现有项目裁剪为可独立启动的 Next.js 工程骨架：保留框架、类型约束、样式工具和少量通用能力，移除 AI 生成、营销、会员、企业定制及公司系统接入。推荐继续使用现有 Ant Design 与 Tailwind 组合，避免在模板化时同时更换技术栈。

另一个可选方向是公司内部业务模板，保留 SSO、权限和 runtime 的接入契约。它依然需要公司包源、后端和账号环境，与通用模板的验收条件不同。本轮按通用模板提出建议，不将该选择视为用户已确认。

本轮覆盖目录清点、46 个页面入口、全局初始化链、接口层、构建配置、依赖声明及代表性基础组件。组件留存候选尚不代表完成逐函数质量审查或运行验证。没有升级框架版本，也不据此判断依赖版本安全性或兼容性。

## 2. 输入与决策

### 2.1 输入事实

- 用户希望将真实项目转成 Next.js 模板，本轮明确先给出代码梳理和取舍意见。
- 已加载根与模板内 `AGENTS.md`、Memory INDEX/TEAM/LOCAL、SDD 索引、技能索引、模板贡献与开发说明、template schema。
- 工作区中的 `templates/web/` 尚未跟踪；不是本轮新建的项目源码，必须保留用户内容。
- `files/` 实际磁盘文件约 1.04 GiB，共 4004 个文件；其中 `dist/` 1240 个文件，约 946.65 MiB。统计包括被忽略的文件，排除了 `.git`、`node_modules`、`.next`。
- `src/` 2702 个文件，约 110.56 MiB；其中 `app/task-data/` 1151 个文件，约 49.37 MiB，含业务素材。
- package.json 声明 75 项 dependencies、24 项 devDependencies，去重后有 19 个 `@meta-carbon/*` 包。
- 源码及 libs 中有 352 个文件出现 `@meta-carbon`，不是移除几个包即可解除的耦合。
- 当前框架声明为 Next.js 16.2.2、React 19.2.4、TypeScript 5.1.6、Tailwind 3.4.x、Ant Design 5.24.5。

### 2.2 核心取舍

| 问题 | 推荐 | 影响 | 状态 |
| --- | --- | --- | --- |
| 通用模板或公司内部模板 | 通用模板，不默认连接公司服务 | 决定是否保留公司 SDK 与环境配置 | 已按用户授权采用推荐方案 |
| UI 栈 | 保留 Ant Design + Tailwind | 降低迁移成本，保留熟悉的开发方式 | 已按用户授权采用推荐方案 |
| 国际化 | 首版不保留，后续按项目需要接入 | 避免预置客户端刷新语言方案 | 实现边界已确定 |
| 请求层 | 保留封装入口，重写业务拦截逻辑 | 保留可替换性，解除登录与购买弹窗耦合 | 建议 |
| 状态管理 | 删除原业务 store；首版不添加状态库示例 | 不同时携带 hox 与 zustand 的原业务状态 | 实现边界已确定 |
| 部署方式 | 普通 Next.js 工程 | 保留 SSR 与服务扩展能力，使用 next build/start | 已按用户授权采用推荐方案 |

用户已授权按上轮推荐执行，不重复要求确认。可选组件按最小工程原则收敛，具体实施见 [implementation-plan.md](../implementation-plan.md)。

## 3. 建议删除的内容

### 3.1 页面与其配套业务

| 路径或页面族 | 当前职责和数据依赖 | 建议 |
| --- | --- | --- |
| `src/app/task-data/**`，37 个 page 入口 | AI 修图、虚拟试衣、素材生成、视频、批量任务、记录、素材库；依赖营销任务、OSS、计费和权限 | 整体移出模板，连同 service、dataSource、配置和素材删除 |
| `src/app/generate-agent/**` | AI 对话与生成入口；引用 GenerateAgent 业务组件与对应 service | 删除 |
| `src/app/generate-agent-flow/**`，workspace/fabric 两个页面 | 流程画布、任务执行、价格、项目持久化和轮询 | 删除；通用 Next.js 模板无需工作流引擎 |
| `src/app/personal/**` | 个人中心与动态静态路由参数；接公司个人中心 SDK | 删除 |
| `src/app/plan/**` | 会员套餐、权益比较和销售入口 | 删除 |
| `src/app/distribution-h5/**` | 推广分销；读取活动时间及分销缓存数据 | 删除 |
| `src/app/none-auth/**` | 403 页绑定公司退出登录和分销回跳 | 删除现实现；基础模板不需要这套鉴权流程 |
| `src/app/home/**` | 营销官网、活动、案例、品牌素材；`/home` 重定向 `/` | 删除原营销实现，首页另写通用起始页 |
| `src/app/config/**` 及根级业务 constant/service/type 文件 | AI 功能注册、菜单、计费、SEO 元信息和业务数据类型 | 删除业务内容；通用配置按实际需要重建 |

上述页面族覆盖现有全部 46 个 page 入口，根 `src/app/page.tsx` 按第 4 节重写。删除应连同所属目录的 service、hooks、样式与素材处理，不仅删除 page 文件。

### 3.2 组件与状态

- 删除 `TaskModule`、`TaskLine`、`GenerateAgent`、`AssetSelector`、`GroupAssetCreator`、`CaseCenter`、`MetacBean`、`ModelInfo`、`ModuleInfo`、生成模式与分辨率选择等业务组件。
- 删除 `components/(fabric)/`、图像蒙版/编辑、PromptInput、图像下载转换等 AI 编辑器能力。`libs/picker/` 是额外的内部拾取插件，也不作为基础模板默认能力。
- 删除现有 Header、LeftMenu、Contact、AdNotification、bot 及业务弹窗；可复用布局应提取结构后重写文案、菜单与行为。
- 删除 `src/model/` 原业务状态：任务、上传、合成、选区、换货、引导、颜色、Gravity 等。消息或通知封装若保留，单独提取。
- 删除上传、OSS、AI 任务解析、微信 OAuth、事件上报、图片算法、Fabric 等专用 hooks 和 wrappers。`wrapper/` 不能整体视为通用封装。
- 删除 `src/api/` 原接口实现。主要接口属于 `/marketing/*`、`/oss/*`、`/bean/*`、`/login/*`、`/sso/*`、`/personal/*`。Point/Size 等基础类型可先迁移到独立 types，再移除原文件。
- 删除 `lib/login*`、`logout`、`sellMarket`、`bingTrack`、`ossBlurhash`、`loader`、业务 dictionary/constant/versionLabel 等实现。
- 删除现有 `lib/permissions/` 和 `app/permissions.css`：provider 依赖 runtime 用户资源与会员版本，资源树与 gate 规则也属于原产品；需要权限模板时再单独设计。
- `wrapper/withRuntime.tsx`、`withSystem.tsx`、`withWeChatOauthConsumer.tsx` 不保留。它们接入公司 runtime、品牌分支和微信登录。

### 3.3 静态文件、产物与工程残留

- 移除 `dist/`、`tsconfig.tsbuildinfo`、`.DS_Store` 等运行产物与系统文件，并维护忽略规则。模板打包规则明确禁止 dist 运行产物，不能靠 publish 排除规则绕过。
- 移除原产品 `src/images/`、业务目录内图片/SVG、视频、动画，以及 `public/media/`、`public/qr/`、`public/purchase/`、`public/cursor/` 等素材。
- 移除搜索引擎验证文件、旧 sitemap XML、旧 robots 内容。favicon 改为中性素材。
- `public/worker.js`、`public/checkAlphaUsable.js`、`public/workers/` 随图像业务移除。
- 移除旧 `TODOLIST.md`、`UPGRADE_LOG.md`、`remove.md`、业务 README 内容和散落业务 TODO/REVIEW。模板外层 README 与 CHANGELOG 保留并更新。
- 单工程没有 workspace，也没有 turbo 依赖或调用脚本，建议移除 `turbo.json`。
- `.pr-agent.toml`、`agent.json`、`agent.config`、`.vscode/settings.json` 和内层 `AGENTS.md` 不原样继承到用户新项目；确有团队模板需求时，只保留审核后的通用内容。
- `.npmrc` 包含公司 scope registry 与多项二进制镜像配置，建议移除旧配置或重写为必要的公开设置。不要复制账号或认证信息。

## 4. 建议保留与改造的内容

### 4.1 保留工程基础

| 内容 | 保留边界 |
| --- | --- |
| Next.js App Router、React、TypeScript | 保留框架与 `src/` 组织方式；不在本轮顺带升级 |
| `tsconfig.json` | 保留 strict、bundler、`@/*` 别名；清除 picker 别名、重复 types 路径和旧 dist 配置 |
| Tailwind、PostCSS | 保留基础能力，清理产品字体、配色、动画；是否使用 preflight 与 Ant Design reset 一并验证 |
| Ant Design 与图标 | 推荐保留公共 UI 能力，仅留下必要 ConfigProvider/App，不携带原业务 Provider 树 |
| `lib/utils.ts` 的 `cn()` | 可复用；其中 border-thin 合并规则与 Tailwind 配置一起精简 |
| `.gitignore`、package.json、锁文件 | 保留文件职责；脚本和依赖清理后在仓库外重新生成锁文件 |
| ESLint 与类型检查命令 | 保留能力；ESLint 从公司配置迁到可独立安装的配置，验证规则与插件匹配 |
| template.json、外层 README、CHANGELOG | 保留发布元数据结构，补齐实际安装与验证能力 |

### 4.2 保留职责但重写实现

1. `src/app/layout.tsx`：保留根布局。移除品牌 SEO、站点验证、Bing 脚本、公司字体/CDN、Activity、StaticHome 与业务样式导入，使用中性 metadata。
2. `src/app/layout.client.tsx`：改为精简的客户端 providers。当前 SSO 注入、window.CONFIG、购买弹窗注册、旧路由兼容、拾取插件、埋点和十余层业务 Provider 全部退出。
3. `src/app/page.tsx`：重写为说明技术栈与启动方式的起始页，移除 DynamicContentLoader 与营销首页链路。
4. `src/app/globals.css` 与 `page.module.css`：只保留 reset、基础布局和明确通用的样式，移除原产品视觉与组件覆盖。
5. `next.config.ts`：重写为最小配置。移除公司代理、固定 OSS bucket/CDN、读取 `.aliyun` 的上传插件、构建时间戳资源前缀及内网开发地址。当前 `.aliyun` 文件不存在，默认 build 路径仍读取它，这是独立构建的阻碍。
6. `src/lib/request.tsx`：若模板保留 Axios，就保留请求入口职责，去除公司 cookie 拦截、业务 code=2000 契约、会员购买、SSO 和业务下载特例。普通网络错误和鉴权错误通过明确契约交给调用方处理。
7. `src/types/declare.d.ts`：保留必要资源声明；删除旧 Ant Design Pro 占位、业务全局对象和无对应依赖的模块声明。通用类型从 API 目录中解耦。
8. `files/README.md`：重新写清模板工具版本、环境项、安装、开发、构建和检查命令，删除原产品操作与业务计费说明。

### 4.3 可选提取候选

| 候选 | 处理建议 |
| --- | --- |
| `components/Empty`、`ErrorCatcher`、`Confirm`、`Tip`、`Tab` 等 | 逐项检查依赖后选择少量保留；去品牌素材与翻译耦合，避免和 antd 重复封装 |
| `components/Button` | 不是原样留存项；目前使用 div 与鼠标事件类型，作为通用按钮应重新检查键盘交互、语义和 disabled 行为 |
| `components/ui/tabs.tsx` | 依赖 Radix 与 cn，通用性较高；已有 antd 时可以不保留第二套 Tabs |
| `components/ui/paragraph-render.tsx` | 仍依赖 `@meta-carbon/mc-hooks`，不能因为在 ui 目录就直接保留 |
| `hooks/(utils)/useInterval.ts`、`useEverObj.ts`、`useStateMayOutControl.ts` | 先检查清理、依赖和实际用途，再提取少量需要的能力 |
| `useAsyncState.ts`、`useSerialAsync.ts` | 依赖公司 hooks/utils；默认删除，需要时用公开能力重新实现 |
| `utils/array.ts`、格式化等纯函数 | 按函数选择；`utils/format.ts` 也引用业务 API 类型和 DOM 功能，不能整目录保留 |
| 复制、下载、上传工具 | 只提取实际需要的通用函数；download 已依赖图像下载 UI/转换链，不能整体保留 |
| `lib/i18n/`、`LocaleSwitcher`、antd locale 适配 | 可选保留轻量客户端方案；删除业务词条、重命名 storage key。当前方案切换会刷新，服务端语言与客户端语言一致性需另行验证 |

## 5. 依赖与脚本裁剪

- 移除全部 `@meta-carbon/*` 对应的业务和工具接入，并替换仍需保留的 lint、hooks、utils 能力。不能先删包后留下导入。
- 随业务删除 Fabric、React Flow、Three/model-viewer、图像算法、PSD、粒子、生成聊天 SDK、Lottie、图像压缩与大文件转换相关依赖。
- `canvas`、`jsdom`、`ali-oss` 等不作为基础模板默认依赖。`@rolldown/binding-darwin-arm64` 不作为跨平台模板的直接固定依赖。
- 对 axios-cache-interceptor、react-virtualized、swiper、jszip、file-saver、Radix、hox、zustand 等按最终留存组件的导入关系决定，不仅凭名称删除。
- 删除 `dev-link:personal`、`dev-update:personal`、Jenkins 触发脚本及公司环境构建脚本。
- 移除旧 `postbuild` 中删除 dist 下所有 txt 的处理。它属于原部署行为，不能作为通用模板约定。
- 统一 `dev/build/start/lint/typecheck` 入口，跨平台脚本避免内嵌 APP_ENV 与 `rm -rf`。构建模式确定后使 README、输出目录与 start 行为一致。
- `test` 目前指向不存在的 `test/vitest.config.mts`；没有真实测试资产时移除该脚本/依赖，或后续建立有意义的最小测试配置，不能保留空承诺。
- 保留一种包管理器与对应锁文件，显式声明 packageManager。清理依赖后在隔离工程重建 lockfile，不手工批量删除锁文件条目。

## 6. 模板交付与页面边界

建议初版只有一个根页面 `/` 和基础 404。首页只展示中性说明和少量组件交互，不加载真实业务数据、不要求账号、不接远端后端。

| 页面 | 业务逻辑与交互 | 接口与触发时机 | loading / empty / error / no-permission |
| --- | --- | --- | --- |
| `/` | 展示起始说明；如保留 UI 示例，只验证本地交互 | 无后端接口，不自动发送业务请求 | 无异步加载与数据空态；渲染失败由错误边界承接；公开访问 |
| `not-found.tsx` 对应兜底 | 中性 404 与返回首页 | 无接口 | loading/empty 不适用；错误展示为 404；公开访问 |
| `error.tsx` 兜底候选 | 显示中性错误和重试入口 | 无业务接口；是否纳入初版待实现边界确认 | error 为该边界自身职责，其余状态不适用 |

如果需要请求示例，后续明确选择本地 fixture 或 Route Handler；普通 Next.js 服务与静态导出需使用各自可工作的实现，不把它与当前真实 API 混用。

template.json 还需要：

1. 将 package 名称、README 等选定文件显式接入 `projectName` token；当前 render 为空，生成后仍是原项目名。
2. 填写 Node/包管理器 requirements；锁定安装验证后，将 manual 适配器改为真实支持的 node/pnpm 配置。
3. 声明可信的 lint、typecheck、build 等 verify 命令；当前 verify 为空，CHANGELOG 明确尚未原生验证。
4. 审查 publish.include 和实际 Git 跟踪文件；当前 `templates/web/` 未跟踪，不具备直接打包发布条件。
5. 更新外层 README/CHANGELOG，必要时同步仓库模板列表说明；本轮不进行发布。

## 7. 后续实施顺序与验收

1. 确认通用或内部模板、UI 栈、国际化、静态导出或普通 Next.js 服务四项边界。
2. 先替换根布局、providers、配置与请求入口，再移除业务目录和失去引用的素材，避免逐页删除时保留全局业务初始化。
3. 精简依赖与脚本，在仓库外生成工程安装和重建锁文件，将审查后的源码及锁文件同步回模板。
4. 补齐模板协议元数据与说明，扫描残留品牌、业务接口、公司 SDK、站点验证、CDN、构建产物与失效导入。
5. 在隔离工程验证锁定安装、lint、typecheck、build 和适用的启动方式；不能在模板 files 内安装、启动或构建。
6. 在已审查的文件纳入 Git 后执行模板验证与生成验证，检查项目名参数生效和基础负载未被污染。

验收目标：全新工程不依赖公司包源、账号或云存储配置即可安装和构建；不自动访问原业务服务，不携带原产品功能与素材；声明的生成、检查与运行命令可执行。

### 评审准入

- [x] 完成现有结构与主要依赖链梳理。
- [x] 区分删除、保留、重写与可选提取候选。
- [x] 用户确认核心模板边界。
- [x] 冻结实际组件白名单与部署模式。
- [x] 实施并完成隔离验证，见 [验证记录](../validation.md)。

初次梳理阶段仅做静态分析；用户授权后已完成实施、锁定安装、lint、类型检查、构建及生成防污染验证，详见验证记录。
