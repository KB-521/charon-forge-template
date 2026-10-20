# Vite + NestJS Template Implementation Plan

**Goal:** 将给定工程迁移为标准前后端模板并完成隔离验证。

**Architecture:** 保留原生 pnpm workspace 与 NestJS 模块，按白名单迁移源码。通用配置、OSS、ENC、静态托管保留，模板元数据负责生成和验证。

**Tech Stack:** React 19、Vite 6、NestJS 11、TypeScript、pnpm 10.18.3、Node 22.12+。

按仓库 SDD 约定集中保存计划，不额外生成 docs/plans 副本；同一会话串行实施，不开启 worker，不自动提交。

### 1. 源码白名单迁移

- 创建 `templates/fullstack/vite-nestjs/files/{web,server,docker}`；复制前端配置与入口、后端 src/tsconfig/nest-cli 及通用部署文件。
- 排除 packages、环境文件、node_modules、dist、协作资料。
- 新增 template.json、README、CHANGELOG；参数化标识并使用路径 filter。

### 2. 配置与开发闭环

- 调整 `server/src/config/runtime-configuration.ts` 与 OSS config/client，支持默认关闭和环境覆盖。
- 修正 runtime-config 响应头；添加 `web/src/lib/request.ts` 与中性联调页。
- 创建 `scripts/package.mjs`，build 后复制静态文件，独立 package 复制 YAML。
- 统一 Docker 工具链和构建上下文；文档解释公开/私有配置、OSS 启用与启动路径。

### 3. 仓库外验证

- 在临时目录复制负载并生成 pnpm-lock.yaml，回写锁文件后创建临时 Git index。
- `pnpm templates:validate`、`pnpm verify:templates --template vite-nestjs --native`：预期元数据、锁定安装、类型检查、构建、独立打包与防污染通过。
- 从真实生成的独立工程启动服务验证 HTTP 和环境配置；不连接 OSS，不新增低价值实现镜像测试。
- `git diff --check`，检查敏感值/旧标识、源与负载摘要、真实 Git index 不变，记录所有实际结果。

### 4. 导航与交付

- 更新根 README、AGENTS 模板导航和 SDD 索引。
- 完善 validation.md、任务执行摘要、设计状态；最终交付模板路径、命令、验证边界、实际 Agent 和 skill。

执行状态：四个步骤均已完成，实际结果与未验证范围见 [验证记录](validation.md)。

## REQ-002 实施步骤

1. 记录本次源文件、模板及真实 Git index 快照；从源实现提炼 OSS 增强与日志，接入 Nest 启动/退出、配置和 Docker 可写目录。
2. 在 web/src/lib 中迁入 abort/request、服务端时钟、Intl 时间格式化、国际化；增加独立组件 LineChart 与 AsyncSearchSelect。
3. 更新中性示例页与组件 API 文档；保持现有依赖与锁文件，迁入内容不含 GIS、天气或私有词条。
4. 临时 Git index 归档，仓库外锁定安装/类型检查/build/package；使用 SDK mock 验证 OSS 与文件生命周期，HTTP 验证日志/配置，真实浏览器验证搜索竞态/键盘、图表多实例、语言与时钟。
5. 检查文件/暂存区摘要、防污染和 diff，补充验证记录并完成任务状态；不提交或发布。

REQ-002 执行状态：五个步骤均已完成，见 [复用迁移验证](reuse-validation.md)。
