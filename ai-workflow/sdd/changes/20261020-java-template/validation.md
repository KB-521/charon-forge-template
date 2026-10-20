# Java 公共模板迁移验证

日期：2026-10-20。当前结果：完成本地验收；未提交、发布或部署。

## 范围与实现

用户最新要求是删除公司内部框架及其业务耦合，覆盖初次保留框架的选择；项目命名补充仍有效。此记录以最终公共组件版本的实际验收为准。

- [需求](tasks/REQ-001.md)、[设计 DES-BE-20261020-003](design/java-template.md)、[设计索引](design/INDEX.md)、[实施计划](implementation-plan.md)。
- [Java 模板](../../../../templates/server/java/README.md)：id java、版本 0.1.0、server/monorepo、manual 安装，CLI 0.1.2+。
- 根 parent 直接使用公开 Spring Boot 2.3.12.RELEASE；Java 8，公共 MyBatis starter 2.1.4、Boot 管理的 MySQL runtime、Web/Actuator/Prometheus。
- 已删除全部内部 parent/starter、专用 DAO 基类、平台/OSS/鉴权/加密配置及自动配置排除项、数据库生成/API 同步插件、映射和 API 工具配置、公司 Maven settings。模板及生成文件扫描没有内部命名残留。
- commons/domain/biz 保留通用模块骨架及内部模块依赖，DAL 使用标准 @Mapper。默认 local 无数据库，dev/pre/prod 只接收 DB_URL/DB_USERNAME/DB_PASSWORD。
- 六模块目录、根/子 POM、modules/依赖、应用名、jar、Ingress 和构建/部署引用均随项目名生成。Java 类名/包默认 com.example.app；两个 jar 分别使用对应 artifactId 命名，容器内部才统一为 app.jar。
- 两入口各自独立；标准 JUnit Jupiter；H2 与探针 Mapper 只用于 DAL 测试，未进入运行时 jar。

## 已执行验收

所有 Maven 构建与 jar 运行均在仓库外。使用临时 GIT_INDEX_FILE 纳入发布白名单，未改变真实 index。

| 检查 | 结果 |
| --- | --- |
| 工具 | Node 22.23.2、pnpm 10.18.3、Maven 3.9.14，显式选择 Zulu JDK 8 |
| 公共依赖证明 | 独立空 Maven localRepository，独立 settings 和 global-settings，将所有仓库 mirror 到 https://repo.maven.apache.org/maven2；首次构建不使用原 Maven 缓存或公司配置，约 1 分钟成功 |
| Maven verify | 完整七项 reactor（根 + 六模块）全部成功；两个应用完成 Boot repackage |
| 有效测试 | 5 项，0 失败/错误/跳过：DAL 在 H2 上执行标准 MyBatis SELECT 1；两个入口各有 HTTP/404 和 local 无数据源检查 |
| 实际依赖 | 新下载的 Maven repository 不存在内部坐标；公开 POM 扫描无内部 groupId。两个可执行 jar 及所有内嵌 jar 均无内部类；无 H2、JUnit 或测试探针 |
| 独立运行 | 两个命名 jar 分别运行，字节码 major 52、Boot 2.3.12.RELEASE；未指定 profile 时默认 local，端口覆盖可用 |
| HTTP | 两入口 check 返回 ok 与 public-demo-web/server；health=UP，prometheus=200；未知路径和 actuator/env 为 404 |
| 数据库环境边界 | 标准 Boot 延迟初始化数据源；prod 无数据库参数时进程 check 为 200，但 health=DOWN/503。已将 Kubernetes readiness 改为 actuator/health，liveness 保留 check，README 同步说明 |
| 原生隔离链路 | Java verify:templates --native 成功；通过仓库外 Maven wrapper 使用同一 Central-only 公共缓存离线运行，5 项测试通过，打包前后摘要一致、生成防污染通过 |
| 多项目名 | 最终公共模板分别生成 public-check 和 order-service，六目录、POM 引用、jar 配置和 Ingress 正确；文件名/内容无原项目名或占位 token，无公司框架 |
| 全模板检查 | 三模板 templates:validate 成功，Java 归档 45 文件（44 payload + 1 元数据）；verify:templates 检查三模板生成与防污染 |
| 静态边界 | XML 可解析、shell 通过 sh -n、render 白名单完整、文档链接有效；负载没有 target、依赖目录或 jar/class/log 运行产物 |
| 来源与暂存 | 来源 37 文件 SHA-256 与迁移前一致；真实 .git/index SHA-256 一致，未暂存 LOCAL.md 或任何文件 |

完整日志与新下载的公共 Maven 缓存留在本机 forge-java-public-* 临时目录。没有复制源配置值或 Maven 凭证。

## 已有 CLI 能力验证

此前为项目名目录/文件名渲染增加可选 render.paths，CLI 版本为 0.1.2。根 typecheck、30 项测试（含新增 6 项路径安全测试）、build、真实 npm tarball 仓库外安装/版本/帮助已通过。此次只改 Java 模板及说明，没有修改该生成核心，不重复运行无关 CLI 测试。

## 验收边界

- 未连接真实 MySQL 或云服务；DAL 使用隔离 H2 测试。没有数据库表、业务接口、登录、鉴权或云存储实现。
- 本机 Docker daemon 不可用，未实测镜像构建/运行或 Kubernetes 部署；只检查脚本、复制路径、Secret 引用和就绪/存活探针配置。
- 保留 Java 8 / Boot 2.3.12 基线，本次未进行框架大版本升级，也未验证 Windows 原生命令或其它 JDK。
- 没有执行 Maven deploy、镜像 push、kubectl apply 或正式发行。

## 上下文命中

Memory INDEX/TEAM/LOCAL、phase-router 和 Agent 已加载；global wiki 对应索引不存在，按 AGENTS、skills 索引、模板贡献说明、协议和原工程事实下钻。

Agent：初次 requirement-manager → design-manager → implementation-executor；命名与公司框架清理由 implementation-executor 串行执行。

Skills：初次 req-dev、req-create、brainstorming、writing-plans、security-auditor；本次明确补充使用 req-dev、brainstorming、writing-plans。无 worker，未提交发布。
