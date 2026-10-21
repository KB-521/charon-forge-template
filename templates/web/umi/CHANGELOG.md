# Changelog

## 0.1.0

- 迁移 Umi Max / React / Ant Design 原生后台，冻结公共依赖并加入标准生成协议。
- 保留通用表格/筛选/排序/分页/选择、上传/Excel、字典/导出、模型/权限/请求和工具示例。
- 移除公司 SSO/私服/Logo/业务接口与固定加密；默认可独立运行，服务与上传显式注入。
- 提供公开运行时 allowlist、静态预览与 nginx/Docker 示例；真实环境和运行产物不分发。
- 按用户要求移除 .env.example，保留 docker-config/.env.dev、.env.prod 并接入开发/生产配置生成；.env.local 仅作本地覆盖，不分发。
- 安装 @charonix/eslint-config@1.2.0 与 ESLint 9，启用 React/TypeScript/Tailwind 规则，整理源码并将零警告 lint 纳入原生验证。

- 生成项目统一省略 pnpm-lock.yaml，安装/验证使用 --no-frozen-lockfile，在本机重新生成锁文件；同步安装和 Docker 说明。

- 本机 pnpm 要求改为 >=10.18.3 <11，移除 packageManager 精确固定；CI 和 Docker 保留明确的验证版本。

- 补齐 package.json 末尾换行，修复发布隔离工程的 style/eol-last 错误；以模板版本 0.1.1 完成原生复验。
