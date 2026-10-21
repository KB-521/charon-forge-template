# Umi Max Web 模板

第四个标准模板，来自既有 Umi Max 后台工程，保留原生 Umi Max 4 / React 18 / Ant Design 5 / Pro Components 2，并提取通用表格、上传、字典、导出和工具能力。

- ID umi；分类 web；布局 single；版本 0.1.0。
- Node 22.12+、pnpm >=10.18.3 <11；node/pnpm 适配器，新工程由本机生成锁文件。
- 项目名渲染包名、默认布局、docker-config 开发/生产公开配置、运行时配置及工程 README。
- ESLint 使用 @charonix/eslint-config@1.2.0；提供 lint / lint:fix，原生 verify 包含零警告 lint。
- 默认浏览器演示数据，开发和静态构建均无需后端；API/上传可配置接入。
- 移除源 SSO、公司 registry/Logo/内网配置、固定加密逻辑与专用业务接口。

审查并纳入 Git 后，在工具仓库执行：

```sh
pnpm template:dev --template umi --output ../umi-dev --name my-admin
```

进入生成工程执行：

```sh
pnpm install --no-frozen-lockfile
pnpm dev
```

维护验证：

```sh
pnpm templates:validate
pnpm verify:templates --template umi --native
```

安装、构建和运行只能在仓库外工程进行。完整配置及复用接口见 [工程 README](files/README.md)；来源能力取舍和实际验收见 [验证记录](../../../ai-workflow/sdd/changes/20261021-umi-template/validation.md)。
