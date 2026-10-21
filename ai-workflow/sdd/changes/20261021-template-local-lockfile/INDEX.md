# 模板在本机重新生成 pnpm 锁文件

- 状态：Done；用户要求所有模板安装前删除 pnpm-lock.yaml，按本机环境解析。
- Agent：implementation-executor；skill：req-dev、brainstorming。Memory、Router、AGENTS、SDD/skills 索引及生成/安装核心已读取；无额外 Memory 偏好，串行实现，无 subagent。
- 范围：统一 stageProject 输出；根/子包 pnpm-lock.yaml 不写入新工程，--no-install、本地开发与远端归档均适用。已发布的归档无需修改内容或摘要，新 CLI 在通过校验后省略锁文件。
- 实现：保留摘要、路径、冲突、token 校验；在写入暂存文件前省略 pnpm 锁文件，包含大小写变体。其它锁文件不受此请求影响。自动 pnpm 安装改用 --no-frozen-lockfile，覆盖 CI 默认冻结行为。
- 配套：Next.js、Vite/NestJS、Umi 原生 verify/README/Docker 不再依赖现有 pnpm 锁文件；Vite Docker COPY 不再要求缺失锁文件。Java 同走通用生成逻辑，无 pnpm 安装步骤。
- 边界：模板源码和归档可保留锁文件作维护基线；根 CLI 依赖锁继续保留和冻结。首次安装生成的新锁文件属于用户项目，安装后不再删除，建议纳入其版本控制。package.json 精确版本、packageManager 和工具要求不在本次请求范围。
- 未提交、推送或发布；线上 npm 用户须使用之后发布的新 CLI 才获得此行为。Docker daemon 不可用，镜像未实测。

[验证记录](validation.md)
