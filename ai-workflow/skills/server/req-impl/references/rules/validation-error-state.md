# Validation Error State

## 适用场景

生成或修改业务校验、字段规则、权限校验、错误码、异常处理、状态字段、状态机或枚举码值时读取。

## 命中条件

| 维度 | 命中信号 |
| --- | --- |
| 产物 | 业务校验、错误码、异常、状态字段、状态机、枚举 |
| 动作 | 新增校验、修改状态、增加错误语义、处理异常分支 |
| 风险 | 状态流转不闭环、错误码归属不明、权限或租户绕过 |
| 可跳过 | 纯展示或纯查询且不新增校验、状态、错误或权限语义 |

## 决策表

| 场景 | 规则 |
| --- | --- |
| 字段规则 | 必填、类型、长度、默认值、权限和边界行为来自 PRD/API/源码或已确认输入 |
| 业务前置校验 | 存在性、状态、权限、租户、组织和外部依赖先校验 |
| 错误码 | 优先复用已有语义；新增时集中归属并同步契约 |
| 异常处理 | 业务失败统一使用 `throw new MetacRuntimeException(errorCodeEnum)`；第三方异常先映射为标准错误码枚举再抛出 |
| 状态机 | 前置状态、触发动作、非法流转错误码和并发保护必须明确 |

## 门禁

- 码值、错误码、权限边界或状态语义不明时，标记缺口，不猜测。
- 业务失败必须使用 `throw new MetacRuntimeException(errorCodeEnum)`；`errorCodeEnum` 是通用占位名，表示目标项目已确认的统一错误码枚举值，禁止直接抛 `RuntimeException`、`IllegalArgumentException` 或只携带 message 的临时异常。
- 错误码枚举不明确时必须标记缺口，不得用字符串、数字、临时常量或硬编码 code 替代。
- catch 中禁止直接 `throw e`、`throw ex` 或原样透传下游异常；必须先记录上下文，再映射为统一错误码枚举并抛出 `MetacRuntimeException(errorCodeEnum)`。
- 写库前必须校验当前状态和数据域归属。
- catch 后不得吞异常并返回成功。

## 交付要求

| 项 | 必填内容 |
| --- | --- |
| 校验规则 | 结构校验和业务校验分别说明 |
| 错误语义 | 错误码枚举、`MetacRuntimeException(errorCodeEnum)` 抛出点和异常映射方式 |
| 状态流转 | 前置状态、目标状态、失败分支 |
| 兼容影响 | 旧状态、旧错误码、旧调用方是否受影响 |

## 高风险反例

- 前端传什么就直接写库。
- 状态更新只按 ID 改，不校验当前状态。
- `throw new RuntimeException("xxx")` 或 `throw new IllegalArgumentException("xxx")`。
- `throw new MetacRuntimeException("xxx message")`。
- catch 后直接 `throw e`、`throw ex` 或把第三方异常原样向外抛。
- 错误码未确认时临时硬编码字符串、数字或 code 常量。
- catch 后记录日志但返回成功。
