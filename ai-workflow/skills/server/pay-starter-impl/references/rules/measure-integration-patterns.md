# Measure 接入模式

## 适用场景

设计或审查 `measure` 依赖支付 starter 的运行模块、handler、adapter、业务状态机、数据枚举、幂等补偿和测试时读取。

## 命中条件

| 维度 | 命中信号 |
| --- | --- |
| 产物 | measure 支付/订阅/退款/提现 handler、adapter、service、枚举、表结构或补偿任务 |
| 动作 | 接入新 provider、处理回调、绑定订单、执行订阅状态流转、处理退款事实或主动退款 |
| 风险 | 业务状态机越界放入 starter、幂等缺失、旧渠道语义被改、资金或权益发放不一致 |
| 可跳过 | 不涉及 measure 侧支付业务承接 |

## 门禁

- 第三方协议解析和签名校验留在 starter；订单、权益、订阅、退款和补偿状态机必须由 `measure` 业务层承接。
- 可重试回调必须先落事件表，再执行副作用；重复回调按 provider event id、transaction id 或 purchase token 幂等。
- 新 provider 变更枚举、表字段或状态机时保持加法兼容，不改变旧渠道处理语义。
- 主动退款与退款事实分开建模；没有第三方服务端退款能力或业务明确要求时，不新增主动退款 adapter。
- 涉及 token、收据、签名、账号或连接配置时只记录脱敏值；找不到真实来源时输出缺口。

## 目录

- 源码入口
- 模块职责
- 依赖接入
- 现有 Handler 模式
- 业务侧接口实现
- 数据和枚举变更
- 幂等和补偿清单
- 验证清单

## 源码入口

先按 `SKILL.md` 的“项目路径定位”解析 `${MEASURE_ROOT}`。在 `${MEASURE_ROOT}` 中优先参考这些路径：

| 领域 | 源码路径 |
| --- | --- |
| 运行模块依赖 | `measure-web/pom.xml`、`measure-server/pom.xml` |
| domain 枚举和 PO | `measure-domain/src/main/java/com/metac/measure/domain/**` |
| DAL manager 和 mapper | `measure-dal/src/main/java/com/metac/measure/dal/**`、`measure-dal/src/main/resources/sqlmap/**` |
| 订单服务 | `measure-biz/src/main/java/com/metac/measure/biz/service/**MeasureOrder**` |
| 通用交易 handler | `measure-web/src/main/java/com/metac/measure/web/pay/MeasureTradeSubmitEventHandle.java`、`MeasureTradeStatusEventHandle.java` |
| Stripe 适配实现 | `measure-web/src/main/java/com/metac/measure/web/pay/stripe/**`、`measure-server/src/main/java/com/metac/measure/server/pay/stripe/**` |
| PayPal 适配实现 | `measure-web/src/main/java/com/metac/measure/web/pay/paypal/**`、`measure-server/src/main/java/com/metac/measure/server/pay/paypal/**` |
| Apple IAP handler | `measure-web/src/main/java/com/metac/measure/web/pay/apple/**` |
| Google Play handler | `measure-web/src/main/java/com/metac/measure/web/pay/google/**` |
| 通用退款事实 | `measure-web/src/main/java/com/metac/measure/web/refund/event/**` |
| 主动退款命令 | `measure-web/src/main/java/com/metac/measure/web/refund/active/**` |
| 补偿调度 | `measure-web/src/main/java/com/metac/measure/web/schedule/**` |

常用检索命令：

```bash
rg -n "implements .*EventHandle|implements .*Service|ActiveRefundChannelAdapter|retryDueEvents" "${MEASURE_ROOT}"
rg -n "MeasurePaymentProviderEnum|MeasureSubscriptionProviderEnum|PayMode|OrderStatus" "${MEASURE_ROOT}/measure-domain"
```

## 模块职责

| 模块 | 支付接入职责 |
| --- | --- |
| `measure-domain` | 枚举、DTO、PO、Query；只有持久化或接口展示需要时才新增 provider code |
| `measure-dal` | 新表或新字段的 DAO、manager、mapper |
| `measure-biz` | 可复用的订单、订阅、退款 service 和业务 helper |
| `measure-web` | 当前主要支付运行模块；依赖渠道 starter 并实现大部分 provider handler |
| `measure-server` | 拆分后的新运行模块；可为自己的入口实现同一 starter 接口 |
| `measure-manager` | 管理端运行模块；除非实际承接渠道回调，否则不要放支付状态机 |

哪个运行模块依赖 starter，哪个运行模块就会通过自动配置获得 starter endpoint。handler 依赖 starter 事件类时，也应放在同一个运行模块中。

## 依赖接入

在实际承接渠道流量的运行模块 POM 中新增：

```xml
<dependency>
    <groupId>com.metac.archetype</groupId>
    <artifactId>metac-<channel>pay-spring-boot-starter</artifactId>
</dependency>
```

然后实现 starter 需要的业务侧接口或事件 handler。

不要默认把 starter 加到所有模块。根据流量入口选择 `measure-web`、`measure-server` 或两者。

## 现有 Handler 模式

### 提交生命周期

`MeasureTradeSubmitEventHandle` 处理 `BEFORE_SUBMIT`、`SUBMIT_FAILD`、`SUBMIT_SUCC`：

- 根据 `orderNo` 查询订单。
- 写入 `payType`、`subject`、`tradeNo`、`tradeAmount`。
- 写入 `tradeStatus` 和 `orderStatus`。
- 通过 service 层更新订单。

通用托管收银台或重定向支付可以复用该模式。

### 一次性支付成功

`MeasureTradeStatusEventHandle` 处理通用 `TRADE_SUCCESS`、`TRADE_FINISHED`、`TRADE_CLOSED`：

- 已完成订单幂等跳过。
- 更新 `tradeNo`、`tradeStatus`、`orderStatus`、`payTime`、`tradeAmount`。
- 通过 `GoodsRedemptionHandlerFactory` 发放权益。
- 更新优惠券状态。
- 事务提交后发送订单成功 MQ。
- 保留已取消 Alipay 订单的原路退款特殊逻辑。

只有新渠道能符合通用一次性支付语义时才复用该 handler。

### IAP 订单绑定

Apple 和 Google 一次性 IAP 不完全依赖通用交易状态：

- 客户端通过 starter endpoint 验证收据或 token。
- starter 发布渠道专属订单绑定事件。
- `measure` 按 transaction id 或 purchase token 加锁。
- `measure` 校验订单、provider 商品 ID、交易冲突和幂等。
- `measure` 写入 `tradeNo`、`originalTradeNo`、`payType`、`payMode`、状态和 remark。
- `measure` 立即发放权益。
- 后续 provider 通知作为补偿或幂等 no-op。

当第三方服务端通知可能早于业务订单绑定时，采用该形态。

### 订阅生命周期

Apple 和 Google 订阅 handler 实现 `SubscriptionEventHandle`：

- 持久化 `MEASURE_SUBSCRIPTION_EVENT`。
- 从 provider event id、notification id、transaction id 等字段解析幂等键。
- 对 event key 和 transaction key 加锁。
- 校验 provider、商品、环境兼容性。
- 创建或更新 `MEASURE_MEMBER_SUBSCRIPTION_CONTRACT`。
- 创建或更新 `MEASURE_MEMBER_SUBSCRIPTION`。
- 创建扣费记录。
- 当生命周期来自订单时更新订单记录。
- 业务状态变化后发送订阅 MQ。
- 基于已落表事件提供 retry 和 replay。

可重试的订阅回调不应直接执行副作用而不落事件记录。

### 退款事实

`measure-web/refund/event/MeasurePaymentRefundEventHandle` 处理渠道侧退款、撤销、voided 等事实：

- 存储或查询 `MEASURE_PAYMENT_REFUND_EVENT`。
- 计算幂等键。
- 对事件 key 加锁。
- 执行订单影响或订阅影响。
- 标记处理状态。
- 必要时发布 billing/refund MQ。
- 通过 `PaymentRefundEventRetrySchedule` 重试已落表事件。

这是“退款已经发生”的事实处理链路，不是“发起退款”的命令链路。

### 主动退款命令

`measure-web/refund/active` 处理用户或后台发起的退款请求：

- `MeasureActivePaymentRefundService` 校验订单归属和生命周期。
- `MeasureActiveRefundChannelService` 按 `PaymentProviderEnum` 路由。
- `ActiveRefundChannelAdapter` 提交第三方退款命令。
- 现有 adapter 包括 Alipay 和 Wechat。
- Apple IAP 与 Google Play 默认保持不支持或外部流程，除非明确设计服务端主动退款链路。

新 provider 只有在第三方支持服务端退款，且业务明确要求主动退款时，才增加 adapter。

## 业务侧接口实现

starter 暴露业务接口时，在 `measure` 实现：

- 订单查询：校验订单存在、provider 要求时只能有一个订单明细、状态为 `WAIT_PAY`、商品 detail 支持该 provider。
- 客户查询：复用 `MEASURE_PAYMENT_CUSTOMER` 或现有等价模型保存 customer id。
- 商户或配置查询：读取运行时配置，只返回 starter 必须字段。
- 提现结果更新：委托已有 withdrawal terminal service 或 open service，不要在 starter 里直接改提现表。

Stripe 和 PayPal 是当前参考实现。

## 数据和枚举变更

新 provider 需要检查是否做加法变更：

- `my-archetype`：`PaymentProviderEnum`、`SubscriptionProviderEnum`、`PayTypeEnum`。
- `measure`：`MeasurePaymentProviderEnum`、`MeasureSubscriptionProviderEnum`、`PayMode`、provider 专属状态枚举。
- `MEASURE_ORDER`：通常复用 `pay_type`、`pay_mode`、`trade_no`、`original_trade_no`、`trade_status`、`remark`。
- `MEASURE_PAYMENT_CUSTOMER`：适合复用来存 provider customer id。
- `MEASURE_SUBSCRIPTION_EVENT`：适合复用来存订阅通知处理状态。
- `MEASURE_PAYMENT_REFUND_EVENT`：适合复用来存渠道退款事实。
- 只有现有 remark/provider 字段无法支持查询、幂等或对账时，才新增字段或表。

若新增表或字段，同步 generator JSON、Mapper XML 和 DAL 约定。

## 幂等和补偿清单

- 优先使用 provider event id 作为幂等键。
- 没有 provider event id 时，才使用 transaction id、purchase token 等字段兜底。
- 回调按 provider event id 加锁；订单绑定按 provider transaction id 或 purchase token 加锁。
- 可重试回调必须先落表，再执行副作用。
- 处理状态优先复用 received、processing、failed、waiting order bind、ignored、success、exhausted 等现有枚举模式。
- replay 必须从已存事件记录恢复，不直接重放外部 provider 请求。
- 回调早于订单绑定时，先标记 waiting，订单绑定事务提交后再解析等待事件。

## 验证清单

至少覆盖：

- 提交成功和提交失败。
- 合法回调成功。
- 非法签名、token 或环境。
- 重复回调。
- 已完成订单。
- 订单不存在。
- provider 商品 ID 不匹配。
- 退款或撤销回调。
- 不支持主动退款的分支。
- 订阅首购、续费、续费失败、取消、过期、退款或撤销。
- retry schedule 能处理已落表的 failed/waiting 记录。

执行最小相关 Maven 范围，例如：

```bash
mvn -f "${MY_ARCHETYPE_ROOT}/pom.xml" -pl my-starters/metac-<channel>pay-spring-boot-starter -am test
mvn -f "${MEASURE_ROOT}/pom.xml" -pl measure-web -am test
```
