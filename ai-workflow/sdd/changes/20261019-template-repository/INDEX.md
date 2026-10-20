# 多技术栈项目模板仓库与 CLI 框架

- Change ID：20261019-template-repository。
- 用户范围已确认：本次只生成并执行框架；实际模板由用户后续逐步写入或导入。
- 当前状态：13 项框架已实现并本机验收；7 项真实模板 Deferred。templates/ 当前仅 README，分发源初始为空。
- [架构方案](design/architecture.md)：DES-BE-20261019-001，保留历史结构取舍。
- [框架技术方案与证据](design/technical-solution.md)：DES-BE-20261019-002，当前执行范围、真实接口与限制。
- [设计索引](design/INDEX.md)。
- [任务索引](tasks/INDEX.md)：基础工程、生成引擎、CI/发布预览、用户后续模板。
- 框架包括单 CLI 包、schema、确定性打包、远程/本地生成、固定安装、源码导入、仓库外开发、CI 和发行预览。
- 已运行类型检查、构建、13 项测试与真实 npm 包隔离安装；跨平台 CI 已配置但远端未运行。
- 没有 Git 提交、线上 Release、Pages 部署或 npm 发布。
