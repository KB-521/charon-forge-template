# Changelog

## 0.1.0

- 补充独立 LineChart、AsyncSearchSelect、取消/超时控制、服务端时钟与轻量国际化。
- 补齐 OSS 查询/流式下载/批量删除；加入按日轮转、保留期与脱敏日志。

- 从现有工程迁移通用 Vite + React / NestJS workspace，加入标准模板协议和项目名渲染。
- 保留健康接口、运行时公开配置、静态托管、可选 OSS 与 ENC 解密兼容。
- 统一 Node 22.12+、pnpm 10.18.3、锁定安装、独立打包和 Docker/CI 示例。
- 默认关闭 OSS；清理原项目标识、固定密码及私有环境值。

- 生成项目统一省略 pnpm-lock.yaml，安装/验证使用 --no-frozen-lockfile，在本机重新生成锁文件；同步安装和 Docker 说明。

- 本机 pnpm 要求改为 >=10.18.3 <11，移除 packageManager 精确固定；CI 和 Docker 保留明确的验证版本。
