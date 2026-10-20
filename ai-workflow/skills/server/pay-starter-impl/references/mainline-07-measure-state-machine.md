# 7. 接入 measure 业务状态机

## 何时读取

需要实现 `measure` handler、adapter、订单状态流转、订阅/退款处理时读取本文件。

## 执行动作

- 一次性通用支付优先复用 `MeasureTradeSubmitEventHandle` 和 `MeasureTradeStatusEventHandle`。
- IAP 主动验单按 Apple/Google 模式实现渠道订单绑定 handler。
- 订阅按 Apple/Google 模式实现 `SubscriptionEventHandle`，先落 `MEASURE_SUBSCRIPTION_EVENT` 再处理业务副作用。
- 渠道退款事实接入 `MeasurePaymentRefundEventHandle`，先落 `MEASURE_PAYMENT_REFUND_EVENT` 再影响订单或订阅。
- 主动退款只增加 `ActiveRefundChannelAdapter`，复用现有主动退款生命周期。

## 产出

- handler/adapter 类。
- 幂等键。
- 锁 key。
- 状态流转。
- MQ 触发点。

## 门禁

支付成功后才发放权益；回调可重试时必须先落表；新校验尽量限制在新 provider、新 appKey、新商品类型或新 parser 入口内。
