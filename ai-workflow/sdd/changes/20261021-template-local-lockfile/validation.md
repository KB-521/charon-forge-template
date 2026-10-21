# 验证记录

## 实现与约束

- 在 stageProject 完成摘要、安全路径、渲染和冲突校验后，省略每个包中的 pnpm-lock.yaml，不触碰模板源码或原归档。此逻辑覆盖 catalog、缓存、本地 template:dev 与 --no-install。
- pnpm 自动安装与三个 Node 模板的原生 verify 使用 install --no-frozen-lockfile；同样适用于 CI 默认冻结行为。其它包管理器仍保持原有策略。
- Docker 初次构建不再要求模板自带 pnpm 锁文件，Vite/NestJS COPY 不再列出该文件；README 和维护导航保持一致。Docker 镜像未实测。
- package.json 精确依赖、pnpm packageManager 和 requirements 本次保持原值；重新解析受这些声明约束，删除旧锁不等于把所有直接依赖改成 latest。

## 实际结果

| 检查 | 结果 |
| --- | --- |
| pnpm typecheck | 通过 |
| pnpm test | 35 项通过，包含新增根/子包/大小写 pnpm 锁文件过滤、源码和归档不变、其它锁文件保留，以及安装 argv/失败恢复检查 |
| pnpm build | 通过 |
| pnpm verify:distribution | 真实 npm tarball 的仓库外安装、版本和帮助检查通过（3 个发布文件）；未执行发布 |
| pnpm templates:validate | 4 个模板通过 |
| pnpm verify:templates | 4 个模板生成、确定性归档与防污染通过 |
| 四次 template:dev | Next.js、Vite/NestJS、Umi、Java 实际生成后递归检查，无 pnpm-lock.yaml |
| CI=true 原生隔离验证 | Next.js、Vite/NestJS、Umi 从无锁新工程安装并执行各自 verify 全部通过；Umi 含零警告 lint、类型检查、13 项测试、生产构建 |
| Git 与源锁文件 | 真实暂存区无变更；根工具和三个模板源 pnpm 锁文件与 HEAD 无差异；git diff --check 通过 |

未额外重复 Java 原生构建；本次未修改 Java 代码或 Maven 安装。原生安装新生成的锁文件位于临时工程，不回写模板；没有删除用户既有工程中的锁文件。尚未提交、推送、发布 CLI 或模板；现网行为需待新版本发布。
