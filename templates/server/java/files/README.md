# `__PROJECT_NAME__`

Java 8 / Maven 六模块工程，直接继承公开的 Spring Boot 2.3.12.RELEASE parent。应用使用 Spring Web、Actuator、Prometheus 与公共 MyBatis/MySQL 依赖；默认 local 环境无需数据库。

## 工具和构建

使用 JDK 8、Maven 3.6.3+。`java -version` 和 `mvn --version` 都应显示 Java 8；显式设置 JAVA_HOME 并将 JAVA_HOME/bin 放入 PATH。Java 工程不需要 Node.js。

依赖和构建插件来自 Maven Central，不需要公司私服或专用 settings。首次构建需要联网下载依赖。

```sh
sh scripts/verify.sh
java -jar __PROJECT_NAME__-web/target/__PROJECT_NAME__-web.jar
```

也可使用 Maven 原生命令：

```sh
mvn --batch-mode --no-transfer-progress verify
java -jar __PROJECT_NAME__-server/target/__PROJECT_NAME__-server.jar
```

verify 构建全部模块、执行 JUnit Jupiter 测试并打包两个独立可执行 jar。测试包含 H2 内存数据库的 MyBatis 查询和两个应用的 local HTTP 检查，不依赖外部数据库。`scripts/verify.sh` 额外检查 Maven 实际使用 JDK 8；Windows 设置好 JAVA_HOME 后使用 Maven 原生命令。

## 模块与命名

| 模块目录 / artifactId      | 职责                                              |
| -------------------------- | ------------------------------------------------- |
| `__PROJECT_NAME__-commons` | 通用常量与工具的 JDK 骨架                         |
| `__PROJECT_NAME__-domain`  | 领域模型和共享 DTO/值对象                         |
| `__PROJECT_NAME__-dal`     | 公共 MyBatis starter、MySQL 驱动、Mapper 与持久化 |
| `__PROJECT_NAME__-biz`     | 业务编排，依赖 dal                                |
| `__PROJECT_NAME__-web`     | 独立 Spring Web 应用，默认端口 7001               |
| `__PROJECT_NAME__-server`  | 独立 Spring Web 应用，默认端口 7002               |

web 是 Java HTTP 入口，不包含浏览器前端。两个入口均依赖 biz，分别打包；不要让它们互相依赖或合并 classpath。

项目名同时进入六模块目录、POM/artifactId、应用名、jar、Ingress 文件名及构建/部署引用。项目名上限 59 字符，保证加 -web 后的 Kubernetes Service 名长度有效。Maven groupId 默认 com.example，Java 包默认 com.example.app，需要时在生成工程中通过 IDE 重构并同步 MapperScan 包名。

两个 jar 分别为 `__PROJECT_NAME__-web/target/__PROJECT_NAME__-web.jar` 与 `__PROJECT_NAME__-server/target/__PROJECT_NAME__-server.jar`，Docker 复制到容器内时统一为 `/app/app.jar`。

## 运行与环境

默认 `SPRING_PROFILES_ACTIVE=local`，只启动 HTTP、日志、健康检查和指标。local 排除数据源、数据源事务和 MyBatis 自动配置；MapperScan 只在非 local 激活。

- `GET /check`：返回 status=ok 和当前 service 名。
- `GET /actuator/health`：健康状态。
- `/actuator/info`、`/actuator/prometheus`：明确开放的维护入口；环境等其它 Actuator 入口未暴露。
- PORT 或 `--server.port=...`：覆盖默认端口。

应用未集成登录、鉴权或云存储，业务访问控制由使用项目接入。

保留 local/dev/pre/prod 四套 profile。切换 dev、pre 或 prod 后启用数据源和 MyBatis，由部署环境注入以下参数：

| 环境变量    | 用途           |
| ----------- | -------------- |
| DB_URL      | MySQL JDBC URL |
| DB_USERNAME | 数据库用户名   |
| DB_PASSWORD | 数据库密码     |

没有预置连接串、数据库账号、表或业务接口。数据库连接按 Spring Boot 默认行为延迟初始化；缺少参数时数据库健康检查/访问失败，即使 HTTP 进程已经启动。部署就绪检查使用 `/actuator/health`，不要仅以 `/check` 判断数据库就绪。不要将 local 排除项复制到集成环境。MyBatis Mapper XML 路径为 `classpath*:mapper/**/*.xml`，Mapper 接口放在 `com.example.app.dal.**.dao` 并标注标准 `@Mapper`，无需继承专用基类。

H2 仅为 dal 的 test 依赖，不进入两个应用的运行时 jar。内存数据库中的探针 Mapper 也仅位于测试源码，不作为应用业务发布。

## 日志与工具

控制台和 DEBUG/INFO/WARN/ERROR 分级日志，MONITOR_LOG、TASK_INFO_LOG、TASK_HEARTBEAT_LOG 为通用可选分类 logger；日期和大小轮转，UTF-8，时间显示为 UTC。

- LOG_DIR：默认 `logs/<应用名>`。
- LOG_HISTORY：默认 14 天。
- LOG_MAX_FILE_SIZE：默认 20MB。
- LOG_TOTAL_SIZE_CAP：每个 appender 默认 1GB。
- ROOT_LOG_LEVEL：默认 INFO。

Tomcat 访问日志记录方法、路径、协议、状态与耗时，不记录查询参数。日志、target、IDE 文件和真实环境文件不进入版本控制。tools/code 保留 Eclipse 格式与代码模板；工程没有数据库代码生成或 API 同步插件。

## Docker 与部署

从生成工程根目录执行：

```sh
sh docker-config/build.sh web __PROJECT_NAME__-web:local
docker run --rm -e SPRING_PROFILES_ACTIVE=local -p 7001:7001 __PROJECT_NAME__-web:local
```

server 入口也可单独构建：

```sh
mvn -pl __PROJECT_NAME__-server -am package
docker build -f docker-config/Dockerfile --build-arg MODULE=__PROJECT_NAME__-server -t __PROJECT_NAME__-server:local .
docker run --rm -e SPRING_PROFILES_ACTIVE=local -e PORT=7002 -p 7002:7002 __PROJECT_NAME__-server:local
```

Dockerfile 使用通用 JRE 8、非 root 用户、可写日志目录和 exec 启动；容器默认 prod、端口 7001，PORT 可覆盖。JAVA_TOOL_OPTIONS 用于 JVM 参数，默认启用容器内存识别与 UTF-8。

build.sh 只构建，不登录、push、改写 YAML 或部署。deploy.yaml 和 `__PROJECT_NAME__-web-ingress.yaml` 需自行配置镜像、域名和包含数据库参数的 Secret；没有 Secret 值。`check-jobs.sh <deployment> [namespace]` 只等待 rollout 状态。
