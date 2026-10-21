# CLI 使用

本地构建：`pnpm build`。当前未发布 npm，先通过 `node dist/cli/index.js` 使用。

```text
create-charon-forge [directory]
  --list
  --template <id> --template-version <exact-semver>
  --name <projectName> --input <key=value>
  --package-manager <supported-tool>
  --yes --install | --no-install
  --version --help
```

分发源通过维护者的 `forge.config.json` 在构建时固定，初始 null 对应空目录。帮助和版本不访问网络；空目录的 list 正常返回。公开命令不读取本地 templates；本地开发使用 `template:dev`。

TTY 中按分类、模板、目录、参数、安装和摘要确认；非 TTY 或 --yes 不等待交互，必须明确提供模板和目标目录。--yes 只采用已定义默认值，默认不安装。目标连空目录也不能预先存在，没有 force/resume；参数不会拼接为 shell 命令。

项目目录和项目名称分别指定：目录可以是 `1`，项目名称及其它公开输入须以小写字母开头，仅含小写字母、数字或单个短横线，不能以短横线结尾，默认最多 63 个字符，并遵循模板的额外限制。项目名称默认取目标目录名；目录为 `1` 时，请将项目名称改为 `app-2` 等有效名称，非交互模式使用 `--name app-2`。交互输入不合法时会就地提示并允许修改，通过全部参数校验后才询问是否安装依赖。

所有模板生成时统一省略 pnpm-lock.yaml（含子目录），--no-install 也不携带该文件；自动 pnpm 安装使用 install --no-frozen-lockfile，依据本机环境和 package.json 重新生成项目自己的锁文件。模板与 catalog 版本、直接依赖声明及工具版本要求仍生效。

生成固定一次 catalog/模板版本，校验归档，暂存并渲染，再独占创建目录。安装失败保留完整工程和重试命令。生成中断可能保留 `.charon-forge.incomplete.json` 和部分新文件；检查残留，选择新目录重试。工具不递归删除目标或覆盖已有文件。

网络故障仅有限重试。完整缓存链路可离线生成，损坏或缺失的 catalog/归档不会被当作成功；离线使用会显示快照版本。首次下载 CLI 和首次获取模板仍需网络。缓存位置为用户目录 `.cache/charon-forge`。

退出码：0 成功，1 内部错误，2 参数/目标冲突，3 网络/离线缓存缺失，4 协议/兼容/完整性/归档/渲染失败，5 写入或未完成状态，6 工具/安装失败，130 取消。

模板 SDK 只在用户选择安装时检测。Windows 优先解析包管理器已安装 JS 入口；无法确认入口时提示手动安装，不通过不安全的 shell 拼接尝试执行 .cmd。
