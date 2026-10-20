# 第三个标准模板：Java / Spring Boot

- Change ID：20261020-java-template。
- 用户输入：从来源 Java 工程新增标准模板；全部原项目占位命名随项目名生成；删除公司内部框架与业务耦合。
- Agent：初次 requirement-manager → design-manager → implementation-executor；后续按明确补充由 implementation-executor 串行修正，没有 worker。
- Memory：INDEX/TEAM/LOCAL 已加载，无附加偏好；按 AGENTS、协议、模板贡献和现有代码下钻。
- [需求](tasks/REQ-001.md)、[设计索引](design/INDEX.md)、[设计 DES-BE-20261020-003](design/java-template.md)、[实施计划](implementation-plan.md)、[验证](validation.md)。
- 当前方案：公开 Spring Boot parent/starter + MyBatis/MySQL；JDK 8、六模块、动态目录/jar 命名；local 无数据库，H2 仅测试。
- 状态：Done；仅 Maven Central 从空缓存构建、5 项测试、双 jar、两种项目名和三模板生成/防污染通过。来源与真实 index 未变，未提交或发布。

- 发布补充：正式 workflow 已按 Java 选择条件配置 JDK 8；actionlint 和本机相同原生命令通过，待提交推送后新 Actions 运行验证。详见 validation.md。
