# 9. 设计补偿、对账和 replay

## 何时读取

需要设计幂等、锁、补偿、人工重放、对账口径时读取本文件。

## 执行动作

- 回调事件优先用 provider event id 作为幂等键；没有时才用 transaction id、purchase token 等兜底。
- 回调按 event id 加锁；订单绑定按 transaction id 或 purchase token 加锁；退款命令按 orderNo 或 request key 加锁。
- 可重试事件使用 received、processing、failed、waiting order bind、ignored、success、exhausted 等现有状态风格。
- replay 必须从已存事件记录恢复，不直接重放未持久化的外部请求。

## 产出

- 幂等键规则。
- 锁规则。
- retry schedule。
- manual replay 入口。
- 对账口径。

## 门禁

不能依赖 provider 重试来弥补本地未落表；不能让一个 provider 回调同时驱动订阅和退款两个业务状态机。
