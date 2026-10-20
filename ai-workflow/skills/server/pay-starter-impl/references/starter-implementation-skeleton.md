# 支付渠道 Starter 实现骨架

## 何时读取

设计或实现新的 `metac-<channel>pay-spring-boot-starter`，或者判断已有 starter 文件结构是否完整时，读取本文件。

本文件只给最小骨架和职责落点。具体类名、方法签名、枚举值必须回到源码用 `rg` 确认。

## starter 最小模块骨架

```text
my-starters/metac-<channel>pay-spring-boot-starter/
├── pom.xml
└── src/main/
    ├── java/<base-package>/<channel>pay/
    │   ├── autoconfigure/
    │   │   └── Metac<Channel>PayAutoConfiguration.java
    │   ├── properties/
    │   │   └── Metac<Channel>PayProperties.java
    │   ├── endpoint/
    │   │   └── <Channel>PayEndpoint.java
    │   ├── client/
    │   │   └── <Channel>PayClient.java
    │   ├── service/
    │   │   ├── <Channel>PayService.java
    │   │   └── impl/
    │   ├── dto/
    │   ├── enums/
    │   ├── constants/
    │   ├── handle/
    │   └── util/
    └── resources/
        └── META-INF/
            └── spring.factories
```

## 模块依赖原则

`pom.xml` 优先依赖：

- `metac-pay-sdk`：复用通用支付事件对象、枚举和 handler 契约。
- Spring Boot 自动配置相关依赖：保持 starter 能被业务运行模块按需装配。
- 渠道官方 SDK 或 HTTP 客户端封装：只处理第三方协议能力。

`pom.xml` 禁止依赖：

- `measure-biz`
- `measure-dal`
- `measure-domain`
- 任何只属于 `measure` 业务状态机、表结构或权益发放的模块。

如果 starter 必须调用业务查询、订单绑定、客户持久化、提现归档等能力，定义窄接口，由 `measure` 运行模块实现。

## 自动配置骨架

`spring.factories` 只注册自动配置类：

```properties
org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
<base-package>.<channel>pay.autoconfigure.Metac<Channel>PayAutoConfiguration
```

自动配置类遵循：

- properties bean 绑定渠道配置，不在文档或日志中复写密钥值。
- provider client/service 使用 `@ConditionalOnMissingBean`，方便业务侧覆盖。
- endpoint 如果依赖业务窄接口，使用 `@ConditionalOnBean` 或等价条件，避免未接入业务实现时暴露不可用入口。
- 不在自动配置阶段访问外部支付平台，避免应用启动被第三方网络抖动拖垮。

## starter 领域职责

starter 负责：

- 第三方支付、订阅、退款、提现协议的 API 调用封装。
- webhook、notify、callback、IAP receipt、purchase token 等渠道输入解析。
- 签名、环境、应用、币种、金额、渠道订单号等协议层校验。
- 将渠道事实转换为 `metac-pay-sdk` 中的标准事件对象。
- 暴露主动能力的 client/service，例如提交支付、主动退款、查询订单、查询订阅、payout 查询。
- 对敏感字段做脱敏日志，保留排障所需的渠道 request id、event id、transaction id。

starter 不负责：

- 直接写 `measure` 业务表。
- 决定业务订单最终状态、权益发放或订阅有效期。
- 将退款事实直接解释成业务退款完成。
- 将提现事实直接归档到商家资产流水。
- 实现 `measure` 的补偿任务、MQ 副作用或运营对账规则。

## measure 接入骨架

在 `measure` 中接入一个 starter 时，通常只在真实承接流量的运行模块加依赖，例如 `measure-web` 或 `measure-server`：

```xml
<dependency>
  <groupId>...</groupId>
  <artifactId>metac-<channel>pay-spring-boot-starter</artifactId>
</dependency>
```

接入代码落点：

- 运行模块实现 starter 暴露的窄接口，调用 `measure-biz` 完成业务查询和状态变更。
- 运行模块实现或装配事件 handler，将 `SubmitEventObject`、`TradeStatusEventObject`、`SubscriptionEventObject`、`PaymentRefundEventObject` 交给业务状态机。
- 主动退款走 `ActiveRefundChannelAdapter` 类模式，命令链路与渠道退款事实事件分开。
- `measure-biz`、`measure-domain`、`measure-dal` 只承接业务领域、持久化和状态机，不反向依赖 starter。

## 最小开发顺序

1. 先冻结渠道能力：一次性支付、IAP 验单、订阅、退款事实、主动退款、提现或 payout。
2. 再确认是否需要扩展 `metac-pay-sdk`；能复用现有事件对象时不新增通用契约。
3. 创建 starter 模块和自动配置，先让应用能启动并注入 client/service。
4. 实现 endpoint 输入解析和渠道 API client，先完成协议层测试。
5. 将渠道事实映射为标准事件对象，不在 starter 内写业务状态。
6. 在 `measure` 运行模块接入 starter 依赖、窄接口实现、handler 和 adapter。
7. 用测试矩阵验证协议解析、事件映射、业务状态机、幂等、补偿和敏感日志。
