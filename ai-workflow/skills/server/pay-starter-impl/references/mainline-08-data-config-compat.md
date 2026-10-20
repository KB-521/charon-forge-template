# 8. 处理数据、配置和兼容

## 何时读取

需要新增枚举、字段、表、配置 key 或兼容旧链路时读取本文件。

## 执行动作

- 检查 `PaymentProviderEnum`、`SubscriptionProviderEnum`、`PayTypeEnum`、`MeasurePaymentProviderEnum`、`MeasureSubscriptionProviderEnum` 是否需要新增值。
- 优先复用 `MEASURE_ORDER` 的 `pay_type`、`pay_mode`、`trade_no`、`original_trade_no`、`trade_status`、`remark`。
- 优先复用 `MEASURE_PAYMENT_CUSTOMER`、`MEASURE_SUBSCRIPTION_EVENT`、`MEASURE_PAYMENT_REFUND_EVENT`。
- 只有查询、幂等、对账无法被现有字段承载时才新增字段或表。

## 产出

- 枚举变更。
- 表字段或 SQL。
- generator JSON。
- 配置 key。
- 敏感配置存放说明。

## 门禁

不得在文档、日志、注释或提交说明中复写密钥、token、账号、签名、连接串。
