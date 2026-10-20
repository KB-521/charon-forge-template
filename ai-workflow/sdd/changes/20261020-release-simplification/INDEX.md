# 统一交互发布入口与模板增量选择

用户已确认 DES-BE-20261020-001，并要求自动检测模板更新、选择发布项和只发布变化部分。实现、本地验证及后续模板/Pages 发行已完成，不自动提交或推送。

- [设计索引](design/INDEX.md)
- [技术方案](design/technical-solution.md)
- [实施计划](implementation-plan.md)
- [验证记录](validation.md)
- [日常发布及一次性配置](../../../../docs/releasing.md)

状态：nextjs@0.1.0 附件与 Pages 下载入口已发布并校验通过；GitHub CLI 已登录。CLI npm 发布此前报 EOTP；现已移除 workflow 的 NPM_TOKEN 依赖，采用本机交互首发与后续 Trusted Publisher（OIDC）。待账号持有人完成首发和 npm 端配置，新 workflow 尚未远端验证。

最新补充：用户日志确认 0.1.2 的 OIDC 提交成功并生成 provenance。按用户最新要求，CLI 发布以 npm 命令退出码 0 为通过，不等待 Validating 或后置公开查询；发布前同版本内容检查保留。类型检查与 11 项针对性测试通过，未自动发布、提交或提升版本。
