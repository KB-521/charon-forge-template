# Changelog

## 0.1.0

- 将真实业务工程裁剪为通用 Next.js + TypeScript + Tailwind CSS + Ant Design 模板。
- 移除 AI 图像/视频、工作流、会员支付、分销、公司 SDK、私有服务配置、品牌素材及构建产物。
- 新增中性起始页、404、错误重试和 Ant Design SSR 样式注册。
- 精简依赖、跨平台命令、严格类型与公开 ESLint 配置，保留通用请求入口和 cn 工具。
- 声明项目名 token、工具要求、pnpm 锁定安装与原生验证命令。
- 根据裁剪范围反馈恢复原工程的通用请求封装、基础组件、hooks、工具及轻量国际化；只解除业务和公司系统耦合，不再以最小骨架作为裁剪目标。
- ESLint 改用 `@charonix/eslint-config@1.2.0`，配置入口改为 `eslint.config.js`，移除 eslint-config-next，增加 lint:fix；TypeScript 调整为满足插件要求的 5.3.3。
- 恢复 local/test/production 环境配置和对应命令，兼容 ci/prod；保留代理、CDN、图片白名单、开发访问来源、超时、线上 console 清理与视频资源导入，移除固定产品地址及自动 OSS 上传绑定。
- 迁移 docker-config/.env.dev、.env.prod 的公开配置机制，兼容 SPRING_PROFILES_ACTIVE，恢复只读 window.CONFIG 与 request 的运行时 BASE_URL；使用 Node 配置路由和 beforeInteractive 适配 Next 服务模式。

- 生成项目统一省略 pnpm-lock.yaml，安装/验证使用 --no-frozen-lockfile，在本机重新生成锁文件；同步安装和 Docker 说明。
