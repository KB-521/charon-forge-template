# 支付渠道 Starter 合规校验模式

## 目录

- 何时读取
- 输入定位
- 审查清单
- 输出格式
- 严重级别参考

## 何时读取

用户要求校验、review、验收、审计某个支付 starter 或支付渠道接入是否合规时，读取本文件。

不要默认读取所有主链文件。只有某一类问题需要展开时，再补读对应 reference。

## 输入定位

先明确审查范围：

- starter 模块路径，例如 `my-starters/metac-<channel>pay-spring-boot-starter`。
- 是否修改 `metac-pay-sdk`。
- `measure` 接入模块，例如 `measure-web` 或 `measure-server`。
- 是否包含订阅、退款、提现、payout、补偿任务。
- 本次审查基于工作区 diff、指定分支、指定 commit，还是全量源码。

如果用户没有指定范围，先用 `git status --short`、`git diff --name-only`、`rg` 找支付相关变更，再说明推断范围。

需要寻找参考实现或记录源码证据时，读取 [source-reference-map.md](./source-reference-map.md)，但最终结论必须以本次工作区源码为准。

## 审查清单

### 1. starter 职责边界

- starter 是否只负责第三方协议、验签、验单、API 调用、payload 解析、事件归一和窄接口定义。
- starter 是否直接依赖了 `measure-biz`、`measure-dal`、`measure-domain`。
- starter 是否直接写业务表、发放权益、改变订单状态、处理订阅有效期、处理退款影响或提现归档。
- 需要展开时读 [rules/INDEX.md](./rules/INDEX.md)，再读取 starter 规则切片。

### 2. pay SDK 契约

- `metac-pay-sdk` 是否只做加法兼容。
- 是否优先复用 `SubmitEventObject`、`TradeStatusEventObject`、`SubscriptionEventObject`、`PaymentRefundEventObject`。
- 是否复用统一支付领域模型，而不是自建并行的支付事件、handler、provider 枚举或状态契约。
- 新增 provider 枚举、event type、handler 接口是否必要且命名一致。
- 是否把 provider 独有字段塞进通用对象，导致旧渠道负担。

### 3. starter 结构和自动配置

- 渠道 starter 是否依赖 `metac-pay-spring-boot-starter`，并复用其统一事件发布、事件工厂和基础自动配置能力。
- payout、transfer、remittance 也必须满足上一条；“不是收单”不能成为缺失统一 pay starter 依赖的豁免。
- 是否有清晰的 `autoconfigure`、`endpoint`、`client`、`service`、`dto`、`enums`、`constants`、`handle`、`util` 分层。
- 是否通过 `META-INF/spring.factories` 注册自动配置。
- 默认 provider service/client 是否使用 `@ConditionalOnMissingBean`。
- endpoint 依赖业务接口时是否使用 `@ConditionalOnBean`。
- 渠道专属事件对象、handler、client/service SPI、endpoint 依赖的 provider 能力接口是否定义在 starter 内，而不是下沉到 `measure`。
- 渠道 webhook 的 HTTP 路由、签名头、raw body、path/query 和 ACK 是否位于 starter；measure 只能实现 starter 定义的窄 handler，不得保留渠道专属 endpoint。
- 需要检查最小实现骨架时读 [starter-implementation-skeleton.md](./starter-implementation-skeleton.md)。

### 4. 事件路由

- 提交生命周期是否发布 `BEFORE_SUBMIT`、`SUBMIT_SUCC`、`SUBMIT_FAILD`。
- 一次性支付成功是否归一到 `TRADE_SUCCESS` 或渠道订单绑定事件。
- 订阅生命周期是否进入 `SubscriptionEventObject` 或渠道子类。
- 渠道退款、撤销、voided、拒付事实是否进入 `PaymentRefundEventObject` 和 `TRADE_REFUND`。
- 一个 provider 回调是否错误地同时驱动订阅和退款两个状态机。

### 5. measure 接入边界

- starter 依赖是否只加在真实承接流量的运行模块。
- handler 依赖 starter 事件类时是否放在运行模块，而不是 `measure-biz`。
- 业务查询、配置查询、客户持久化、提现结果更新是否由 `measure` 实现窄接口。
- 公共服务改动是否保持旧业务兼容。
- 需要展开时读 [rules/INDEX.md](./rules/INDEX.md)，再读取 measure 规则切片。

### 6. measure 业务状态机

- 支付成功后才发放权益。
- 一次性支付是否复用或兼容 `MeasureTradeSubmitEventHandle`、`MeasureTradeStatusEventHandle`。
- IAP 主动验单是否有订单绑定、交易冲突校验和幂等处理。
- 订阅和退款回调是否先落事件表再执行业务副作用。
- 主动退款是否通过 `ActiveRefundChannelAdapter`，而不是复用退款事实事件。

### 7. 数据、配置和敏感信息

- provider 枚举是否在 `my-archetype` 和 `measure` 两侧保持必要一致。
- 是否优先复用 `MEASURE_ORDER`、`MEASURE_PAYMENT_CUSTOMER`、`MEASURE_SUBSCRIPTION_EVENT`、`MEASURE_PAYMENT_REFUND_EVENT`。
- 新表或新字段是否有明确查询、幂等或对账理由。
- 文档、日志、注释、提交说明中是否复写密钥、token、账号、签名、连接串。

### 8. 幂等、补偿和 replay

- provider event id 是否作为首选幂等键。
- 没有 provider event id 时，transaction id、purchase token 等兜底规则是否稳定。
- 回调、订单绑定、退款命令是否使用合适锁粒度。
- 可重试事件是否先落表。
- replay 是否从已存事件记录恢复，而不是重放未持久化的外部请求。

### 9. 测试覆盖

- starter 是否覆盖 payload 解析、签名/环境校验、事件映射、敏感日志脱敏。
- `measure` 是否覆盖重复回调、订单不存在、订单已完成、商品不匹配、环境不匹配、退款/撤销、订阅生命周期、主动退款不支持分支。
- 是否执行了最小 Maven 范围测试。
- 需要展开测试范围或判断覆盖缺口时读 [payment-channel-test-matrix.md](./payment-channel-test-matrix.md)。

## 输出格式

合规校验输出必须按 code review 风格组织：

1. Findings
- 按 P0/P1/P2/P3 排序。
- 每条包含文件路径、行号或可定位证据、问题、影响、修复建议。

2. Verdict
- `通过`：没有阻塞问题。
- `有条件通过`：只有低风险问题或文档/测试缺口。
- `不通过`：存在职责越界、状态机风险、资金风险、敏感信息泄露、幂等补偿缺失等问题。

3. Coverage
- 已审查范围。
- 未审查范围。
- 已执行或建议执行的测试命令。

## 严重级别参考

- P0：可能导致资金错账、重复发放权益、敏感信息泄露、生产回调不可用。
- P1：职责越界、状态机破坏、幂等或补偿缺失、旧渠道兼容风险。
- P2：测试缺口、配置风险、错误处理不完整、日志不充分或过量。
- P3：命名、结构、文档可维护性问题。
