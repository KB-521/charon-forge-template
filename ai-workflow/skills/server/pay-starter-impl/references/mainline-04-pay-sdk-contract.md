# 4. 设计 pay SDK 契约

## 何时读取

需要新增或复用事件对象、枚举、handler 接口时读取本文件。

## 执行动作

- 先检查现有 `EventObject`、`SubmitEventObject`、`TradeStatusEventObject`、`SubscriptionEventObject`、`PaymentRefundEventObject`、`EventTypeEnum`、provider 枚举是否足够。
- 一次性支付优先复用 `SubmitEventObject` 和 `TradeStatusEventObject`。
- IAP 订单绑定优先新增渠道专属 event object 和 handler 接口。
- 订阅优先使用 `SubscriptionEventObject` 的 provider 字段或渠道子类。
- 渠道退款事实统一使用 `PaymentRefundEventObject` 和 `EventTypeEnum.TRADE_REFUND`。

## 产出

- 事件类型。
- 事件对象字段。
- 是否新增枚举。
- 是否新增 handler 接口。

## 门禁

只有现有契约无法表达新渠道语义时才改 `metac-pay-sdk`；所有 SDK 变更必须加法兼容。
