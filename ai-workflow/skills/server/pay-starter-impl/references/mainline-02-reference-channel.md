# 2. 找最接近的现有渠道

## 何时读取

需要选择类比实现、确定复用模式或评审方案来源时读取本文件。

## 参考选择

- 需要快速选择参考源码时，读 [source-reference-map.md](./source-reference-map.md)。
- 托管收银台优先看 Stripe/PayPal。
- 重定向或 SDK 支付优先看 Alipay/Wechat。
- IAP 主动验单优先看 Apple/Google 的订单绑定。
- 订阅生命周期优先看 Apple/Google 订阅 handler，Stripe 只作为早期订阅字段兼容参考。
- 主动退款优先看 `measure-web/refund/active`。
- 渠道退款事实优先看 `PaymentRefundEventObject` 和 `measure-web/refund/event`。

## 产出

- 主参考渠道。
- 备用参考渠道。
- 选择原因。
- 明确不复用的旧模式。

## 门禁

没有源码类比时，先写出和现有事件模型的差异，再决定是否扩展 SDK。
