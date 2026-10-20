# Vite + React + NestJS 模板

从已有前后端工程迁移的通用 pnpm workspace。保留 Vite React 前端、NestJS 服务端、健康检查、浏览器运行时公开配置、生产静态托管，以及可选 OSS 服务、ENC 解密兼容和 Docker/Jenkins 示例。默认无需密钥和云服务即可开发启动。

模板 ID：`vite-nestjs`；分类：`fullstack`；布局：`monorepo`；初始版本：0.1.0。

使用 Node.js 22.12+、pnpm 10.18.3。审查并将模板纳入 Git 后，在仓库根目录执行：

```sh
pnpm template:dev --template vite-nestjs --output ../vite-nestjs-dev --name my-fullstack-app
```

进入生成目录后：

```sh
pnpm install --frozen-lockfile
pnpm dev
```

工程说明、配置和部署见 [files/README.md](files/README.md)。安装与构建只在仓库外生成的工程中执行，不在 files 中运行。

已补充独立折线图、异步搜索选择器、请求取消/超时、共享服务端时钟、轻量国际化、OSS 增强和脱敏文件日志，见 [通用能力与组件 API](files/docs/reusable.md)。全部沿用现有依赖。

## 维护与验证

```sh
pnpm templates:validate
pnpm verify:templates --template vite-nestjs --native
```

原生 verify 包括锁定安装、两端类型检查、生产构建和独立打包；不会启动常驻服务。运行期 HTTP 验证记录见 [迁移 SDD](../../../ai-workflow/sdd/changes/20261020-vite-nestjs-template/validation.md)。

projectName 仅在 template.json 声明的精确文件中渲染；子包名、服务标识、标题和 Jenkins 模块名同步变更。根脚本使用目录过滤器，锁文件无需渲染。发布文件由 include 与 Git 跟踪白名单决定。

未导入来源的本地环境文件、地球瓦片、运行产物或协作知识库；没有修改来源项目。
