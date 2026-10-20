# Changelog

## 0.1.0

- Java 8 / Spring Boot 公共六模块模板，manual 安装，双 HTTP 入口、MyBatis/MySQL、分环境配置、健康检查、Prometheus 和分级日志。
- 所有来源项目占位名称随 projectName 渲染，包括六模块目录、artifactId、应用名、jar、Ingress 与构建/部署引用；需要 CLI 0.1.2+。
- 使用公共 parent/starter，清理内部框架、私服、专用生成和 API 同步工具；默认 local 不连接数据库，H2 仅用于测试。
- 提供无自动发布行为的 Docker/Kubernetes 示例及仓库外验证流程。
