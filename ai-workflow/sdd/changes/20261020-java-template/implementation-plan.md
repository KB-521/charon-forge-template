# Java Public Template Implementation Plan

**Goal:** 第三个标准模板使用公共 Java 组件，所有原项目命名随 projectName 渲染。

**Architecture:** Maven 六模块，公开 Spring Boot parent、公共 MyBatis/MySQL、双独立 Web 入口；manual 安装，local 无数据库，环境变量配置集成环境。CLI 使用显式 render.paths 白名单，不执行生成后的重命名脚本。

**Tech Stack:** Java 8、Maven 3.6.3+、Spring Boot 2.3.12.RELEASE、MyBatis starter 2.1.4、JUnit Jupiter、H2（仅测试）、CLI 0.1.2。

按仓库约定保存在 SDD；串行执行，无 worker，不提交发布。用户最新的公司框架移除要求替代初次保留框架的选择。

1. 来源只读快照与工具检查；通过 schema、archive、pack 和路径边界测试补齐 CLI 0.1.2 render.paths。保持已有模板不声明 paths 时的行为。
2. 六模块目录改为 `__PROJECT_NAME__-{commons,domain,dal,biz,web,server}`，恢复根/子 POM、modules/依赖、应用名、jar、Ingress 和工具引用的项目名前缀。默认包 com.example.app。
3. 根 POM 直接继承公共 Boot parent，删除内部 parent/starter/专用 DAO、公司配置、生成/API 工具、映射及私服 settings；DAL 使用标准 @Mapper，两个入口使用公开 Web/Actuator/Prometheus，移除无用工具依赖。
4. local 仅排除数据源/事务/MyBatis，dev/pre/prod 仅注入 DB_URL/DB_USERNAME/DB_PASSWORD；JUnit Jupiter 验证双入口和无数据源，新增 H2 上标准 MyBatis SELECT 1 验证。保留通用日志、格式配置与安全部署示例。
5. 仓库外生成两种项目名并检查所有命名。对最终公共模板使用空独立 Maven 缓存、独立 settings/global-settings 和 Central-only mirror 构建；检查 5 项有效测试、两个运行 jar 无内部组件及测试依赖。
6. 运行双 jar HTTP 检查、模板原生隔离/防污染、三模板校验、XML/shell/敏感值检查和来源/index 摘要检查。完善导航、README、设计、需求和验证。

实际结果以 [验证记录](validation.md) 为准；Docker/真实外部数据库不在已完成验收范围。

全部步骤已完成，实际验收见 validation.md。
