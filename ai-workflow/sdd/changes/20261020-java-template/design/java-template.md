# Java 六模块模板设计

方案索引ID：DES-BE-20261020-003。

## 当前范围与选择

用户授权新增第三个 Java 标准模板，并明确补充两项要求：全部来源项目占位名称随项目名生成；公司内部框架及其业务耦合必须移除。最终方案使用公开 Spring Boot parent 与公共 MyBatis/MySQL 组件，不继承原公司 parent，也不携带其 starter、代码、配置或工具。该要求替代初次迁移保留框架的选择。

沿用 Java 8 / Spring Boot 2.3.12.RELEASE 基线，本次不进行大版本升级。直接使用公共 starter 比仿制内部框架接口更符合通用模板目的，避免将专用鉴权、OSS、领域基类、翻译和平台 API 语义变成模板依赖。

## 协议与命名

`templates/server/java`，id java、版本 0.1.0、layout monorepo。六模块目录为 `__PROJECT_NAME__-{commons,domain,dal,biz,web,server}`。CLI 0.1.2 的可选 render.paths 精确路径/目录前缀白名单在安全暂存时渲染；内容清单指基础模板原路径，输出重新校验保留路径、大小写/Unicode 以及文件目录冲突，失败清理暂存。

项目名进入根/子 POM artifactId、modules 与模块依赖、应用名、jar、Ingress 文件名、构建和部署引用，所有原项目占位命名均动态替换。项目名上限 59 字符，适配 Kubernetes Service 后缀。Maven groupId 默认 com.example，Java 包默认 com.example.app，包名重构由使用者在生成后执行。

安装适配器为 manual；JDK 8、Maven 3.6.3+。维护原生 verify 使用 POSIX sh 检查 Maven 实际 JDK 后执行 Maven verify；Windows 使用生成工程的 Maven 原生命令。Java 工程不需要 Node。

## 分层与运行

- commons：JDK 通用骨架；domain 依赖 commons；dal 依赖 domain；biz 依赖 dal。
- dal：公共 mybatis-spring-boot-starter 2.1.4、Boot 管理的 MySQL runtime，使用标准 @Mapper 扫描，不继承专用 DAO 基类。
- web/server：各自依赖 biz 和公开 spring-boot-starter-web、actuator、prometheus，分别运行于 7001/7002，分别 repackage。
- 两个 finalName 使用 `${project.artifactId}`；Docker 按实际模块目录/jar 复制为容器内 app.jar。
- 根直接继承 spring-boot-starter-parent 2.3.12.RELEASE，统一 BOM、编译、JUnit Jupiter、插件与 Prometheus 版本。无内部 Maven profile、repository 或 settings。

local 默认只启动 HTTP、日志、health/info/prometheus，排除数据源/数据源事务/MyBatis；MapperScan 在非 local 激活。dev/pre/prod 仅从 DB_URL/DB_USERNAME/DB_PASSWORD 注入数据库参数。移除原平台、OSS、加密和鉴权配置，模板不内置登录或云存储。

测试使用公开 JUnit Jupiter：两个应用 local HTTP 与无数据源检查各 2 项；dal 另有 H2 内存数据库真实 MyBatis SELECT 1 验证。H2 与探针 Mapper 只存在测试范围，不进入运行 jar。

## 工具与部署

保留 Eclipse 格式/代码模板、通用日志轮转、Docker build-only 和 Kubernetes Deployment/Ingress 示例。删除内部数据库生成器、生成映射、API 同步插件及其 smart-doc 配套配置、公司 Maven settings；不存在自动外部写入。

Docker 使用通用 JRE 8、非 root、exec 启动和可写日志目录；Kubernetes 仅引用使用者配置的数据库 Secret，不含值。源码来源始终只读，所有构建/运行在仓库外。

## 验证计划

临时 Git index 检查归档白名单、生成、确定性和防污染；空 Maven localRepository 加独立 settings/global-settings，全部仓库镜像到 Maven Central，证明构建不依赖公司缓存或私服。执行 5 项测试，检查两个 jar 的运行及依赖，确认没有内部框架、H2 或测试探针进入运行包。来源 37 文件和真实 Git index 比较 SHA-256；Docker 引擎未实测则明确记录。
