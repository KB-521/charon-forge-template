# 独立开发与测试

`files/` 是基础源码。安装、开发服务、构建和测试均在仓库外生成的工程中执行：

```sh
pnpm template:dev --template my-template --output ../my-template-dev --name my-dev
```

输出父目录须已存在，目标目录须不存在。可重复 `--input key=value` 填写没有默认值的必填公开参数。框架只生成文件并显示操作说明，不自动安装或启动，不写入公开 catalog；`.charon-forge.json` 将来源记为 local-dev。

生成工程不复制 pnpm-lock.yaml（含子包），维护者在模板源码中保留的锁文件不受影响。pnpm 原生 verify 使用 --no-frozen-lockfile，验证在当前平台重新解析依赖后的工程；安装新生成的锁文件留在隔离目录。

进入生成工程后，按它的 README 使用原生工具。开发工程内允许热更新和构建，运行产物留在该工程。需要保留的修改由维护者审查差异，逐文件同步回 `files/`，参数化文件恢复 token。不要把整个开发目录复制回来。

```sh
pnpm verify:templates --template my-template
pnpm verify:templates --template my-template --native
```

第一条只执行打包、生成、重复包摘要与新工程检查；第二条额外运行模板声明的 verify argv，每条有 5 分钟超时。没有模板时检查成功并报告 0。原生命令只用于受信任仓库模板，校验器不会替你安装所有 SDK。带特殊必填参数时重复传入 `--input`；projectName 由验证器固定为 verify-project。

实际应用的服务健康检查、安装、平台构建由模板作者补充 verify 和适用 runner。Next.js 与 Vite + NestJS 模板的声明验证已在本机隔离工程中执行；后者还包含独立包运行和前后端代理的 HTTP 验证。Java 模板以 manual 安装适配器保留 Maven 工程，需显式选择 JDK 8，依赖从 Maven Central 获取；已在本机隔离工程完成公共依赖构建、5 项集成测试与两个独立 jar 的 HTTP 检查。POSIX 下可执行 `pnpm verify:templates --template java --native`，Windows 生成工程请使用 Maven 原生命令。Docker、其它平台与线上运行以各模板的实际验收结果为准。

Umi 模板使用公开 npm 依赖，生成后由 pnpm 重新解析安装，已在仓库外通过 @charonix/eslint-config 零警告 lint、类型检查、13 项测试、生产构建、11 组演示模式和 5 组 API/运行时浏览器检查，以及开发服务深链接检查。四模板生成与防污染检查通过；Docker daemon 不可用，镜像构建未实测。详情见 [Umi 验证记录](../ai-workflow/sdd/changes/20261021-umi-template/validation.md)。

正式增量发布使用 `pnpm release`，自动检测变化并只验证选中模板；运行时可覆盖归档版本，不回写基础模板。详见[发布说明](releasing.md)。
