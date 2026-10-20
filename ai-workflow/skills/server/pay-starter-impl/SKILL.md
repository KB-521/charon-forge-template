---
name: pay-starter-impl
description: "指导 agent 在 my-archetype 体系中设计、实现或合规校验第三方支付渠道 Spring Boot starter，并说明 measure 如何依赖该 starter 接入支付、订阅、退款、提现等链路。适用于新增支付渠道、改造或 review alipay/wechatpay/applepay/googlepay/stripepay/paypal 类似 starter、审查支付 starter 是否越界依赖 measure、校验渠道事件对象和 measure EventHandle/Adapter 接入是否合规。"
version: 1.0.1
owners:
  - xuyang
---

# 支付渠道 Starter

## 边界

用于设计、实现或合规校验 `my-archetype` 第三方支付渠道 Spring Boot starter，并说明 `measure` 如何依赖该 starter 接入支付、订阅、退款、提现等链路。

核心边界：渠道 starter 负责第三方协议接入和标准化事件发布；`measure` 负责业务订单状态、权益发放、订阅记录、退款影响、提现影响、持久化、补偿和 MQ 副作用。

## 路径定位

禁止写死成员本机绝对路径。执行前解析两个根目录：

- 优先使用环境变量 `MY_ARCHETYPE_ROOT`、`MEASURE_ROOT`。
- 若当前工作区或相邻目录包含目标项目，可用 `find .. -maxdepth 3 -type d -name my-archetype` 和 `find .. -maxdepth 3 -type d -name measure` 辅助定位。
- 如果仍无法唯一定位，向用户询问路径。

定位后先做最小校验：

```bash
test -f "${MY_ARCHETYPE_ROOT}/pom.xml"
test -d "${MY_ARCHETYPE_ROOT}/my-starters"
test -f "${MEASURE_ROOT}/pom.xml"
test -d "${MEASURE_ROOT}/measure-domain"
```

后续所有命令和文档都使用 `${MY_ARCHETYPE_ROOT}`、`${MEASURE_ROOT}` 或相对路径表达。

## 加载策略

不要一次性读取所有 `references/`。按任务阶段加载：

- 开发新渠道：沿“主链索引”逐步读取 `mainline-*.md`。
- 合规校验：先读 [audit-payment-channel-starter.md](./references/audit-payment-channel-starter.md)，再按发现补读规则或专项资料。
- 职责边界：先读 [rules/INDEX.md](./references/rules/INDEX.md)，再按命中条件读 starter 或 measure 规则切片。
- 实现骨架：按需读 [starter-implementation-skeleton.md](./references/starter-implementation-skeleton.md)。
- 源码证据：按需读 [source-reference-map.md](./references/source-reference-map.md)，再用 `rg` 回到源码验证。
- 测试验收：按需读 [payment-channel-test-matrix.md](./references/payment-channel-test-matrix.md)。

当源码与本 skill 冲突时，以源码为准。方法签名、枚举名、模块依赖必须用 `rg` 和源码确认，不要凭记忆补齐。

## 主链索引

开发新支付渠道时沿这条主线推进。每一步只加载对应文件，完成后再加载下一步。

| 步骤 | 目标 | 只在执行该步时读取 |
| --- | --- | --- |
| 1 | 冻结输入和目标边界 | [mainline-01-scope.md](./references/mainline-01-scope.md) |
| 2 | 找最接近的现有渠道 | [mainline-02-reference-channel.md](./references/mainline-02-reference-channel.md) |
| 3 | 判定 starter 与 `measure` 职责 | [mainline-03-boundary.md](./references/mainline-03-boundary.md) |
| 4 | 设计 pay SDK 契约 | [mainline-04-pay-sdk-contract.md](./references/mainline-04-pay-sdk-contract.md) |
| 5 | 设计并实现 starter 模块 | [mainline-05-starter-module.md](./references/mainline-05-starter-module.md) |
| 6 | 设计 `measure` 运行模块接入 | [mainline-06-measure-runtime.md](./references/mainline-06-measure-runtime.md) |
| 7 | 接入 `measure` 业务状态机 | [mainline-07-measure-state-machine.md](./references/mainline-07-measure-state-machine.md) |
| 8 | 处理数据、配置和兼容 | [mainline-08-data-config-compat.md](./references/mainline-08-data-config-compat.md) |
| 9 | 设计补偿、对账和 replay | [mainline-09-reliability.md](./references/mainline-09-reliability.md) |
| 10 | 验证和交付 | [mainline-10-validation.md](./references/mainline-10-validation.md) |

## 合规校验模式

当用户要求“检查某个支付 starter 是否合规”“review 支付渠道接入”“看 starter 有没有越界”“验收渠道接入质量”时，使用合规校验模式。

1. 定位待审查范围：starter 模块、pay SDK 改动、`measure` runtime 接入、配置和测试。
2. 读取 [audit-payment-channel-starter.md](./references/audit-payment-channel-starter.md)。
3. 按 audit 文档跑完整审查清单。
4. 只有发现需要展开的专项问题时，再补读规则切片、源码地图、测试矩阵或对应主链步骤。
5. 输出按严重级别排序的问题清单、证据路径、修复建议和结论。

## 职责门禁

- starter 可以负责：配置绑定、endpoint、第三方验签/验单/API 调用、payload 解析、事件归一、窄接口定义、敏感日志脱敏。
- starter 不应该负责：直接写 `measure` 表、发放权益、决定订阅有效期、处理退款影响、处理提现归档、依赖 `measure-biz` / `measure-dal` / `measure-domain`。
- `measure` 必须负责：依赖 starter、实现业务接口和 handler、校验订单和商品、更新订单状态、发放权益、落订阅/退款事件、补偿重试、MQ 副作用。
- 事件建模：一次性支付优先用 `SubmitEventObject` / `TradeStatusEventObject`；订阅用 `SubscriptionEventObject`；退款、撤销、voided、拒付事实用 `PaymentRefundEventObject`；主动退款命令走 `ActiveRefundChannelAdapter`；提现或 payout 单独建模。
- **无语义豁免**：acquiring、IAP、订阅、退款、transfer、payout/remittance 都属于渠道 starter 接入。即使某渠道仅承接 payout、不发布一次性支付事件，仍必须依赖 `metac-pay-spring-boot-starter`，并将该渠道的 HTTP endpoint、签名头/path/raw body 处理和 ACK 响应放在 starter；`measure` 运行模块只能实现 starter 定义的窄 handler，不得自建渠道 HTTP 入口。

## 输出要求

- 开发模式输出：渠道能力分类、starter 结构、`measure` 接入、必要变更、幂等补偿、测试计划和受影响 Maven 模块。
- 合规校验模式输出：按 [audit-payment-channel-starter.md](./references/audit-payment-channel-starter.md) 的格式给出 findings、verdict 和 coverage。
