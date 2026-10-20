# 支付渠道源码参考地图

## 何时读取

需要选择最接近的现有渠道、确认源码入口、寻找类名/方法名/包结构参考时，读取本文件。

本文件只做导航，不替代源码。所有实现细节必须用 `rg`、`find`、`mvn test` 在 `${MY_ARCHETYPE_ROOT}` 和 `${MEASURE_ROOT}` 中确认。

## 参考选择规则

- 一次性支付：优先对比 Alipay、WechatPay、Stripe、PayPal。
- webhook 验签和事件分发：优先对比 Stripe、PayPal。
- IAP 主动验单和订单绑定：优先对比 ApplePay、GooglePay。
- 订阅生命周期：优先对比 ApplePay、GooglePay、Stripe。
- 渠道退款事实：优先对比 ApplePay/GooglePay voided 或 Stripe/PayPal refund 事件。
- 主动退款：优先对比 Alipay、WechatPay 的 `ActiveRefundChannelAdapter` 接入。
- 自动配置和 starter 分层：优先对比 ApplePay、GooglePay、StripePay starter。

## my-archetype 参考地图

| 场景 | 参考入口 | 重点学习 |
| --- | --- | --- |
| 通用支付契约 | `${MY_ARCHETYPE_ROOT}/my-starters/metac-pay-sdk` | `EventObject`、`SubmitEventObject`、`TradeStatusEventObject`、`SubscriptionEventObject`、`PaymentRefundEventObject`、provider/event 枚举、handler 接口 |
| 通用支付 starter | `${MY_ARCHETYPE_ROOT}/my-starters/metac-pay-spring-boot-starter` | 基础自动配置、事件发布、通用 endpoint/service 风格 |
| 支付宝渠道 | `${MY_ARCHETYPE_ROOT}/my-starters/metac-alipay-spring-boot-starter` | 同步提交、异步回调、主动退款 client、传统三方支付建模 |
| 微信支付渠道 | `${MY_ARCHETYPE_ROOT}/my-starters/metac-wechatpay-spring-boot-starter` | notify 解析、主动退款、渠道证书/验签类问题 |
| Stripe 渠道 | `${MY_ARCHETYPE_ROOT}/my-starters/metac-stripepay-spring-boot-starter` | webhook 验签、事件类型分发、订阅和一次性支付混合事件处理 |
| PayPal 渠道 | `${MY_ARCHETYPE_ROOT}/my-starters/metac-paypal-spring-boot-starter` | webhook、订单捕获、provider 事件 id 幂等 |
| Apple IAP | `${MY_ARCHETYPE_ROOT}/my-starters/metac-applepay-spring-boot-starter` | receipt / transaction 校验、订阅事件、订单绑定事件 |
| Google Play IAP | `${MY_ARCHETYPE_ROOT}/my-starters/metac-googlepay-spring-boot-starter` | purchase token 校验、voided/refund 事实、订阅通知 |
| 自动配置样例 | 在 `${MY_ARCHETYPE_ROOT}/my-starters` 中 `rg "AutoConfiguration|spring.factories"` | 自动配置注册、条件 bean、properties 前缀 |
| 事件对象样例 | 在 `${MY_ARCHETYPE_ROOT}/my-starters` 中 `rg "extends .*EventObject|new .*EventObject|EventTypeEnum"` | 渠道 payload 到标准事件的映射边界 |

## measure 参考地图

| 场景 | 参考入口 | 重点学习 |
| --- | --- | --- |
| 运行模块依赖 starter | `${MEASURE_ROOT}/measure-web` 或 `${MEASURE_ROOT}/measure-server` | starter 依赖应该加在哪个运行模块，避免领域模块反向依赖渠道 |
| 支付提交事件 | 在 `${MEASURE_ROOT}` 中 `rg "MeasureTradeSubmitEventHandle|TradeSubmitEventHandle"` | 提交前、提交成功、提交失败如何进入业务状态机 |
| 支付状态事件 | 在 `${MEASURE_ROOT}` 中 `rg "MeasureTradeStatusEventHandle|TradeStatusEventHandle"` | 一次性支付成功、失败、关闭、重复通知如何幂等处理 |
| 订阅事件 | 在 `${MEASURE_ROOT}` 中 `rg "SubscriptionEventHandle|MeasureAppleSubscriptionEventHandle|MeasureGooglePlaySubscriptionEventHandle"` | 订阅生命周期事件如何先落库再触发副作用 |
| 退款事实事件 | 在 `${MEASURE_ROOT}` 中 `rg "PaymentRefundEventHandle|MeasurePaymentRefundEventHandle|MEASURE_PAYMENT_REFUND_EVENT"` | refund/voided/dispute 类事实如何持久化和影响订单 |
| 主动退款 adapter | 在 `${MEASURE_ROOT}` 中 `rg "ActiveRefundChannelAdapter|MeasureAlipayActiveRefundChannelAdapter|MeasureWechatActiveRefundChannelAdapter"` | 主动退款命令链路和渠道退款事实链路如何分开 |
| 业务服务边界 | `${MEASURE_ROOT}/measure-biz` | 订单、商品、权益、订阅、退款、提现状态机由业务层负责 |
| 领域和持久化 | `${MEASURE_ROOT}/measure-domain`、`${MEASURE_ROOT}/measure-dal` | 领域对象、manager、mapper、幂等键、事件表结构 |
| 配置入口 | 在 `${MEASURE_ROOT}` 中 `rg "<channel>|pay|payment|subscription|refund"` | 只定位配置项位置，不复写密钥、账号、签名或连接串 |

## 常用源码确认命令

```bash
rg "class Metac.*PayAutoConfiguration|spring.factories" "${MY_ARCHETYPE_ROOT}/my-starters"
rg "interface .*EventHandle|class .*EventObject|enum .*Provider" "${MY_ARCHETYPE_ROOT}/my-starters/metac-pay-sdk"
rg "PaymentRefundEventObject|SubscriptionEventObject|TradeStatusEventObject" "${MY_ARCHETYPE_ROOT}/my-starters"
rg "ActiveRefundChannelAdapter|PaymentRefundEventHandle|SubscriptionEventHandle" "${MEASURE_ROOT}"
rg "metac-.*pay-spring-boot-starter" "${MEASURE_ROOT}"
```

## 证据记录要求

在方案、审查或交付说明中记录源码证据时，只写相对路径或 `${MY_ARCHETYPE_ROOT}`、`${MEASURE_ROOT}` 变量路径；不要写成员本机绝对路径。
