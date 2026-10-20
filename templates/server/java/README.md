# Java / Spring Boot 模板

第三个标准模板：Java 8、Maven 六模块、Spring Boot 2.3.12.RELEASE、公共 MyBatis/MySQL、双 HTTP 入口、分环境配置与日志。父工程、依赖与插件均使用公开组件。

- 模板 ID java；分类 server；布局 monorepo；版本 0.1.0。
- manual 安装适配器；需要 JDK 8、Maven 3.6.3+，首次构建从 Maven Central 下载依赖。
- projectName 渲染六模块目录、POM/artifactId、应用名、jar、Ingress 文件名及构建/部署引用；例如 my-java-app-biz、my-java-app-web。默认包 com.example.app。
- 目录与文件名渲染需要 CLI 0.1.2+，项目名上限 59 字符。
- local 无需外部数据库；dev/pre/prod 使用环境注入数据库参数。H2 只用于测试。

审查并纳入 Git 后，在工具仓库根执行：

```sh
pnpm template:dev --template java --output ../java-dev --name my-java-app
```

在生成工程选择 JDK 8 后运行：

```sh
sh scripts/verify.sh
java -jar my-java-app-web/target/my-java-app-web.jar
```

完整配置见 [工程 README](files/README.md)。安装、构建和运行只在仓库外生成工程执行。

维护验证：

```sh
pnpm templates:validate
pnpm verify:templates --template java --native
```

原生 verify 使用 POSIX sh，Windows 可在生成工程直接运行 Maven。验收结果与边界见 [验证记录](../../../ai-workflow/sdd/changes/20261020-java-template/validation.md)。
