# 独立开发与测试

`files/` 是基础源码。安装、开发服务、构建和测试均在仓库外生成的工程中执行：

```sh
pnpm template:dev --template my-template --output ../my-template-dev --name my-dev
```

输出父目录须已存在，目标目录须不存在。可重复 `--input key=value` 填写没有默认值的必填公开参数。框架只生成文件并显示操作说明，不自动安装或启动，不写入公开 catalog；`.charon-forge.json` 将来源记为 local-dev。

进入生成工程后，按它的 README 使用原生工具。开发工程内允许热更新和构建，运行产物留在该工程。需要保留的修改由维护者审查差异，逐文件同步回 `files/`，参数化文件恢复 token。不要把整个开发目录复制回来。

```sh
pnpm verify:templates --template my-template
pnpm verify:templates --template my-template --native
```

第一条只执行打包、生成、重复包摘要与新工程检查；第二条额外运行模板声明的 verify argv，每条有 5 分钟超时。没有模板时检查成功并报告 0。原生命令只用于受信任仓库模板，校验器不会替你安装所有 SDK。带特殊必填参数时重复传入 `--input`；projectName 由验证器固定为 verify-project。

实际应用的服务健康检查、锁定安装、平台构建由模板作者补充 verify 和适用 runner。Next.js 模板的声明验证已在本机隔离工程中执行；其它平台与线上运行以各模板的实际验收结果为准。

正式增量发布使用 `pnpm release`，自动检测变化并只验证选中模板；运行时可覆盖归档版本，不回写基础模板。详见[发布说明](releasing.md)。
