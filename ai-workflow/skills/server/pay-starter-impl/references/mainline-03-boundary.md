# 3. 判定 starter 与 measure 职责

## 何时读取

需要拆分 starter 和 `measure` 责任、避免跨层耦合时读取本文件。

## 职责判断

- starter 只做第三方协议、验签、验单、API 调用、payload 解析、事件归一和窄接口定义。
- `measure` 做订单状态、权益发放、订阅记录、退款影响、提现影响、持久化、补偿、MQ。
- 需要更多细节时，读 [rules/INDEX.md](./rules/INDEX.md)，再按命中条件读取 starter 或 measure 规则切片。

## 产出

一张两列表格，列出每个能力点由 starter 负责还是 `measure` 负责。

## 门禁

- starter 不得依赖 `measure-biz`、`measure-dal`、`measure-domain`。
- `measure` 不得把第三方协议细节散落到业务 service。
