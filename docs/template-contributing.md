# 模板编写与导入

仓库初始没有应用模板。先选一个实际项目，在仓库外开发；准备维护基础模板时导入：

```sh
pnpm template:import --source ../existing-project --id web-my-app --category web --name "My app"
```

来源目录必须已经存在，目标模板目录必须不存在且不位于来源目录内部。导入保持普通文件、锁文件、公开 `.env.example`、`docker-config/.env.dev`、`docker-config/.env.prod` 与执行位，跳过依赖、缓存、构建产物、日志、真实环境文件及默认不分发的 AI 协作资料；拒绝符号链接或特殊文件。导入不自动执行项目代码，不改变原项目名称、不自动纳入 Git。导入失败若已创建目标，检查残留后选择新目录；工具不会覆盖合并。

也可手工创建同样结构：`template.json` 是外层描述，`files/` 内容原样映射到新项目根目录。完整字段约束见 `schemas/template.schema.json`。下面仅是协议示例，不是已提供的应用模板：

```json
{
  "schemaVersion": 1,
  "id": "my-template",
  "version": "0.1.0",
  "name": "My template",
  "category": "custom",
  "layout": "single",
  "tags": [],
  "minCliVersion": "0.1.0",
  "source": "files",
  "inputs": { "projectName": { "type": "string", "required": true } },
  "render": { "tokens": {}, "files": [] },
  "publish": { "include": ["**/*"] },
  "requirements": [],
  "install": { "adapter": "manual" },
  "verify": []
}
```

用 `render.tokens` 声明例如 `"__PROJECT_NAME__": "projectName"`，并把实际包含该 token 的精确文件路径列入 `render.files`。只替换显式 UTF-8 文本，不推测源码/JSON 普通括号。文件内容的白名单路径以基础模板中的原始路径为准。声明但未使用的 token、残留 token 或不在文件白名单的 token 都会报错。输入当前限公开标识符，小写字母开头、数字/单短横线，默认上限 63 位；未来自由文本需要额外编码策略。

需要随项目名命名文件或模块目录时，CLI 0.1.2+ 支持可选的 `render.paths`，并要求 `minCliVersion` 至少为 0.1.2。例如：

```json
{
  "render": {
    "tokens": { "__PROJECT_NAME__": "projectName" },
    "paths": ["__PROJECT_NAME__-biz", "docker-config/__PROJECT_NAME__-web-ingress.yaml"],
    "files": ["pom.xml", "__PROJECT_NAME__-biz/pom.xml"]
  }
}
```

`paths` 声明精确文件路径或目录前缀；目录规则覆盖其下所有普通文件，规则不能嵌套，不支持 glob。只替换声明前缀中的 token，后缀里的其它 token 必须通过独立且不重叠的路径规则表达。规则必须命中发布集合；未声明的路径 token、未解析的 token、安全/保留路径或渲染后大小写/Unicode/文件目录冲突都会拒绝生成，并清理私有暂存目录。最终暂存文件清单与提交使用渲染后的路径，二进制内容与执行位保持不变。已有模板不声明 paths 时保持原行为。

导入后必须检查：

1. `files/README.md` 写清实际工具版本、安装、启动、构建、测试及必要配置；没有 README 时自行补充。
2. `requirements` 分 install/verify；版本范围使用 SemVer 语义。框架自动安装只支持 node、npm/pnpm/yarn、uv 的检测；不支持的工具用 manual 和原生说明。
3. Node 适配器的 packageManagers 只声明可验证的工具。pnpm 使用 frozen-lockfile，npm 使用 ci，yarn 使用 immutable；有相应锁文件才启用。Python uv 默认禁止下载系统 Python，先准备所需 Python。
4. `verify` 是受信任的维护者命令数组，在独立工程内执行；不由公开 CLI 自动运行。不要写真实密钥，不把后台常驻服务作为不会退出的 verify 步骤。
5. 归档由 include 与 Git 跟踪文件的交集组成；include 命中未跟踪文件会报错，已跟踪污染文件即使命中排除范围也会报错。必要新增文件先审查并手工纳入 Git。
6. 以新目录验证生成后的工程。确认源码和包摘要在运行前后不变，再升版本、写 CHANGELOG、准备发布。

`dist/target/build` 等运行产物目录目前统一禁止。确有同名基础源码目录时应先调整框架规则并新增验证；不要通过删除校验绕过。CLI 基础负载的 `.charon-forge.json`、`.charon-forge.incomplete.json` 为保留名。

文件要求可跨平台：拒绝链接、越界路径、Windows 保留名、大小写或 Unicode 规范化后冲突。基础文本由 Git 属性固定 LF；二进制保持原始字节。
