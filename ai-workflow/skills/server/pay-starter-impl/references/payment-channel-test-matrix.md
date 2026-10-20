# 支付渠道测试矩阵

## 何时读取

设计测试计划、审查测试覆盖、执行最终验收或判断某个支付 starter 是否可交付时，读取本文件。

测试矩阵按能力选择，不要求每个渠道覆盖所有行；渠道不支持的能力要在交付说明中明确标注“不适用”和原因。

## 覆盖矩阵

| 能力 | starter 测试 | measure 测试 | 必须断言 |
| --- | --- | --- | --- |
| 一次性支付提交 | client/service 参数映射、渠道 API 响应解析、`BEFORE_SUBMIT` / `SUBMIT_SUCC` / `SUBMIT_FAILD` 事件 | 订单存在、金额/币种/商品匹配、重复提交、提交失败回滚或保持原状态 | starter 不写业务表；提交事件不直接发权益；失败事件不误标成功 |
| 一次性支付回调 | notify/webhook 验签、环境校验、event id 提取、`TradeStatusEventObject` 映射 | 订单不存在、订单已完成、重复回调、金额不匹配、支付成功发权益 | 幂等键稳定；成功只发放一次；异常不吞掉关键排障字段 |
| IAP 订单绑定 | receipt / purchase token / transaction 校验、渠道订单对象映射 | appKey、商品、用户、订单绑定、交易冲突、重复验单 | 同一个渠道交易不能绑定多个业务订单；环境不匹配必须失败 |
| 订阅生命周期 | 订阅通知解析、续费/取消/过期/恢复事件映射 | 订阅事件先落库、状态变更、权益续期、重复事件 | 不用一次性订单状态机硬塞订阅；事件可 replay |
| 渠道退款事实 | refund、voided、chargeback、dispute 类 payload 解析和 `PaymentRefundEventObject` 映射 | 退款事件落库、订单影响、权益回收或冻结、重复退款通知 | 渠道事实和主动退款命令分开；重复通知不重复扣权益 |
| 主动退款 | client 请求参数、渠道错误码、超时和不支持能力分支 | `ActiveRefundChannelAdapter` 路由、退款申请状态、重试和失败展示 | adapter 不复用退款事实 handler；不支持渠道有明确失败语义 |
| 提现或 payout | payout 查询、回调验签、渠道状态映射 | 商家资产流水、提现申请状态、失败重试和人工处理入口 | 不强行塞进购买订单状态机；资金状态变更可审计 |
| 配置与敏感日志 | properties 绑定、缺失配置启动行为、日志脱敏 | 运行模块配置加载、灰度开关或 provider 开关 | 文档、日志、异常中不出现密钥、token、签名、连接串 |
| 幂等与 replay | provider event id、transaction id、purchase token 的兜底规则 | 事件表唯一键、锁粒度、重复投递、补偿任务 | replay 从已存事件恢复，不重放未持久化的外部请求 |
| 错误输入 | 签名错误、payload 缺字段、渠道状态未知、重复通知、乱序通知 | 业务异常分类、状态不倒退、可观测日志 | 错误输入不能改变业务成功状态；未知状态不静默成功 |

## starter 最小测试点

- payload 或 receipt 解析：成功、缺字段、未知状态、非法环境。
- 验签或验单：成功、失败、配置缺失、渠道 SDK 异常。
- 事件映射：event type、provider、交易号、订单号、金额、币种、事件时间、幂等键。
- 自动配置：properties 绑定、默认 bean、业务覆盖 bean、endpoint 条件装配。
- 日志脱敏：密钥、token、签名、原始 receipt、连接串不得明文输出。

## measure 最小测试点

- handler 或 adapter 正常路径。
- 重复回调、重复验单、重复退款通知。
- 订单不存在、订单已完成、订单状态不允许流转。
- 商品、金额、币种、appKey、环境不匹配。
- 订阅事件先落库再副作用。
- 退款事实事件与主动退款命令分离。
- 旧渠道回归：新增渠道改动不得改变既有 alipay、wechatpay、applepay、googlepay、stripepay、paypal 语义。

## 建议执行命令

按实际模块名替换 `<channel>`，只运行受影响模块和依赖模块：

```bash
mvn -f "${MY_ARCHETYPE_ROOT}/pom.xml" -pl my-starters/metac-<channel>pay-spring-boot-starter -am test
mvn -f "${MY_ARCHETYPE_ROOT}/pom.xml" -pl my-starters/metac-pay-sdk -am test
mvn -f "${MEASURE_ROOT}/pom.xml" -pl measure-web -am test
```

如果 `measure` 真实承接流量的运行模块不是 `measure-web`，替换为对应模块，例如 `measure-server`。

## 交付说明必须包含

- 已覆盖能力和不适用能力。
- 已执行命令、结果和失败原因。
- 未覆盖风险和建议补测项。
- 涉及资金、权益、订阅、退款、提现的幂等证据。
