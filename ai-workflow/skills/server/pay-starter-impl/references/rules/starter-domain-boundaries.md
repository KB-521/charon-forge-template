# Starter 领域边界

## 适用场景

设计或审查 my-archetype 支付渠道 starter、通用 pay SDK 契约、自动配置、事件发布、业务窄接口和安全边界时读取。

## 命中条件

| 维度 | 命中信号 |
| --- | --- |
| 产物 | 支付渠道 starter、pay SDK 事件、自动配置、provider endpoint、业务扩展接口 |
| 动作 | 新增渠道、调整事件映射、接入第三方 webhook、扩展 handler 或窄接口 |
| 风险 | starter 越界依赖业务系统、事件语义不兼容、敏感配置泄露、旧渠道行为漂移 |
| 可跳过 | 不涉及 starter 或 pay SDK 边界 |

## 门禁

- starter 只做第三方协议适配和标准事件发布，不依赖 `measure` 实现模块。
- 业务数据通过窄接口获取，不在 starter 契约中暴露业务 PO、DAO、manager 或 service 实现。
- 新渠道只能加法扩展 pay SDK 契约；必须修改通用契约时保持旧 provider 兼容。
- 收据、purchase token、webhook body、签名、私钥、账号 ID 和 Authorization header 只允许脱敏或摘要记录。
- 找不到真实 SDK、provider 文档或现有事件契约时输出缺口，禁止猜测字段和状态映射。
- payout、transfer、remittance 不是 endpoint 下沉到业务系统的例外：渠道 starter 仍必须依赖 `metac-pay-spring-boot-starter`，并负责 HTTP 路由、请求头、raw body、path/query 与 ACK；业务系统只能实现 starter 内定义的窄 handler。

## 目录

- 源码入口
- 通用 Pay SDK 职责
- 渠道 Starter 职责
- 事件发布模式
- 业务扩展接口模式
- 自动配置规则
- 安全规则

## 源码入口

先按 `SKILL.md` 的“项目路径定位”解析 `${MY_ARCHETYPE_ROOT}`。在 `${MY_ARCHETYPE_ROOT}` 中优先参考这些路径：

| 领域 | 源码路径 |
| --- | --- |
| 通用支付事件 | `my-starters/metac-pay-sdk/src/main/java/com/metac/base/pay/**` |
| 事件工厂自动配置 | `my-starters/metac-pay-spring-boot-starter/src/main/java/com/metac/base/pay/autoconfigure/MetacPayAutoConfiguration.java` |
| Alipay 提交/回调/退款 | `my-starters/metac-alipay-spring-boot-starter/src/main/java/com/metac/base/alipay/**` |
| Stripe Checkout/原生支付/Webhook | `my-starters/metac-stripepay-spring-boot-starter/src/main/java/com/metac/base/stripepay/**` |
| PayPal 下单/捕获/payout webhook | `my-starters/metac-paypal-spring-boot-starter/src/main/java/com/metac/base/paypal/**` |
| Apple IAP 验单/通知/订阅/退款映射 | `my-starters/metac-applepay-spring-boot-starter/src/main/java/com/metac/base/applepay/**` |
| Google Play Billing 验单/通知/订阅/退款映射 | `my-starters/metac-googlepay-spring-boot-starter/src/main/java/com/metac/base/googlepay/**` |
| Measure 远程 SDK | `my-starters/metac-measure-sdk/src/main/java/com/metac/measure/sdk/**` |

常用检索命令：

```bash
rg -n "EventTypeEnum|PaymentRefundEventObject|SubscriptionEventObject|EventHandleFactory" "${MY_ARCHETYPE_ROOT}/my-starters"
rg -n "ConditionalOnBean|ConditionalOnMissingBean|spring.factories" "${MY_ARCHETYPE_ROOT}/my-starters"/metac-*pay*-spring-boot-starter
```

## 通用 Pay SDK 职责

`metac-pay-sdk` 定义 provider starter 和业务系统之间的标准化契约，是统一支付领域模型的来源：

- `EventObject`：基础字段，包括 `payType`、`appid`、`method`、`orderNo`、`subject`、`amount`、`passbackParams`、`tradeStatus`、`tradeNo`、`payeeAccount`。
- `SubmitEventObject`：提交订单生命周期事件。
- `TradeStatusEventObject`：一次性支付状态事件。
- `SubscriptionEventObject`：订阅生命周期事件；新渠道优先使用 provider 字段，不要继续依赖已废弃的 Stripe 早期字段。
- `PaymentRefundEventObject`：渠道侧已经发生的退款、撤销、voided 等事实；不是主动退款命令。
- `EventTypeEnum`：`EventHandleFactory` 使用的路由键。
- provider 枚举：`PaymentProviderEnum`、`SubscriptionProviderEnum`、`PayTypeEnum`、`PayModeEnum`。
- handler 接口：`TradeSubmitEventHandle`、`TradeStatusEventHandle`、`SubscriptionEventHandle`、`PaymentRefundEventHandle` 以及渠道专属 handler 接口。

渠道 starter 必须优先复用这些统一支付领域模型。只有现有契约无法表达新渠道语义时才修改 `metac-pay-sdk`，并保持加法兼容。

## 渠道 Starter 职责

支付渠道 starter 是 Spring Boot 集成适配层，负责把第三方协议翻译成通用 pay SDK 契约。

推荐包职责：

| 包 | 职责 |
| --- | --- |
| `autoconfigure` | 绑定配置，注册 service、endpoint、client |
| `endpoint` | 暴露提交、验单、回调、webhook、必要的内部重放入口 |
| `client` | 封装第三方 API 调用 |
| `service` | 解析、验签、路由、查询第三方状态、发布事件 |
| `dto` | 请求、响应、上下文对象 |
| `enums` | 第三方状态和类型映射 |
| `constants` | 配置前缀、回调成功响应、静态 key |
| `handle` | 渠道专属事件对象和 handler 接口 |
| `util` | 签名、摘要、payload 提取、时间转换 |

starter 必须依赖 `metac-pay-spring-boot-starter`，通过通用支付 starter 获得统一事件发布、事件工厂和基础自动配置能力；不得绕过统一支付领域模型自建一套并行事件、handler 或 provider 契约。

starter 不依赖 `measure` 实现模块。

### Payout / transfer webhook

Payout 或 transfer 不一定适合复用 `TradeStatusEventObject`，但这不改变渠道入口边界：

1. starter 定义渠道专属 webhook request、handler 和必要的 ACK 契约，并暴露 endpoint。
2. starter 通过自动配置和 `@ConditionalOnBean` 在业务运行模块提供 handler 时注册 endpoint。
3. `measure-web` / `measure-server` 只实现该 handler，将验签后的渠道事实交给提现状态机、持久化和补偿服务。
4. 不得把 `@RequestMapping`、header/path/raw body 解析或 provider ACK 下沉到 `measure` endpoint。

## 事件发布模式

### 提交生命周期

参考 Alipay、Stripe、PayPal：

1. 构建 `SubmitEventObject`。
2. 发布 `BEFORE_SUBMIT`。
3. 调第三方提交、创建或捕获 API。
4. 成功发布 `SUBMIT_SUCC` 和 `WAIT_BUYER_PAY`；失败发布 `SUBMIT_FAILD` 和 `WAIT_SUBMIT_PAY`。

### 一次性支付回调

参考 Alipay、Stripe、PayPal、Apple IAP 一次性支付、Google 一次性支付：

1. 校验签名、token、收据或购买环境。
2. 解析业务订单号或第三方交易号。
3. 构建 `TradeStatusEventObject` 或渠道专属订单绑定事件。
4. 只发布一条业务状态事件。

当第三方确认来自客户端收据/token 验单，且服务端通知可能早于业务订单绑定到达时，使用渠道专属订单绑定事件。

### 订阅生命周期

参考 Apple、Google、Stripe：

1. 解析第三方生命周期动作。
2. 归一为 `SubscriptionActionEnum` 和 `MemberSubscriptionStatusEnum`。
3. 填充 `provider`、`providerEventId`、`providerSubscriptionId`、`providerTransactionId`、`productId`、`periodStartMs`、`periodEndMs`、`environment`。
4. 通过渠道事件类型发布，例如 `APPLE_IAP_SUBSCRIPTION` 或 `GOOGLE_PLAY_BILLING_SUBSCRIPTION`。

### 退款或撤销事实

参考 Apple/Google 退款映射：

1. 判断 provider 回调是否属于 refund、revoke、voided、chargeback、consumption request 等事实。
2. 构建 `PaymentRefundEventObject`。
3. 优先使用 `providerEventId` 或第三方交易字段生成稳定幂等键。
4. 通过 `EventTypeEnum.TRADE_REFUND` 发布。

不要用 `PaymentRefundEventObject` 表达主动退款命令。

## 业务扩展接口模式

渠道专属接口分两类处理：

1. 由 starter 定义的接口：第三方协议接入、渠道专属事件对象、渠道专属 handler、client/service SPI、endpoint 依赖的 provider 能力接口，以及只服务于该渠道自动配置和事件路由的契约。这些接口必须放在渠道 starter 内，不能下沉到 `measure`；否则会让 `measure` 反向承接第三方协议模型，破坏 starter 复用、自动配置边界和统一支付模型。
2. 由业务系统实现的窄接口：当 starter 需要订单、商品、配置、客户、提现归档等业务数据或业务动作时，在 starter 内定义最小接口，由 `measure` 运行模块实现。

当 starter 需要业务数据时，定义窄接口由业务系统实现：

- `StripeOrderService`：`measure` 校验订单并返回第三方 price/goods 信息。
- `StripeCustomerService`：`measure` 持久化客户 ID 并查询渠道配置。
- `PayPalService`：`measure` 查询商户配置、商品信息并更新提现结果。
- `MeasureRemoteService`：starter 通过窄接口查询订单金额。
- `GooglePlayOrderLookupService`：starter 通过 SDK client 解析 appKey 和商品类型。

接口保持窄，不要在 starter 契约里暴露 `measure` PO、manager 或 DAO。

## 自动配置规则

starter 提供默认 provider service 或 client 时，使用 `@ConditionalOnMissingBean`。

starter 依赖业务侧接口才能安全暴露 endpoint 时，使用 `@ConditionalOnBean`。Stripe 是当前参考：只有存在 `StripeCustomerService` 和 `StripeOrderService` 时才注册 endpoint。

Spring Boot 2.x 体系下通过以下文件注册：

```text
src/main/resources/META-INF/spring.factories
```

内容示例：

```properties
org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
  com.metac.base.<channel>.autoconfigure.Metac<Channel>PayAutoConfiguration
```

## 安全规则

- 收据、purchase token、webhook body、签名、私钥、账号 ID、Authorization header 只记录摘要或脱敏值。
- 第三方要求固定回调成功响应时，成功 body 要可配置或常量化。
- 新增渠道时保留旧状态映射，不改变旧渠道行为。
- 订阅与退款状态机互斥时，一个 provider 回调只能发布一条业务路由。
- HTTP 状态要符合 provider 重试语义；签名非法这类不可恢复错误不要伪装成可重试成功。
