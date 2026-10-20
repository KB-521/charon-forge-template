# API-Mock 测试代码场景矩阵

本文件用于生成 Java 接口测试代码，不生成规格文件和 JSON suite。

## 覆盖档位

- `full`：默认按“正例 / 反例 / 边界 / 并发”四大类组织测试方法。
- `minimal`：至少覆盖 1 个成功场景 + 1 个失败或边界场景。
- `minimal` 命中并发、状态机、锁、补偿、导入导出、open 等高风险主题时，仍需补专项测试。

## 正例

| scene | 何时必填 | 说明 |
| --- | --- | --- |
| `success_basic` | 必填 | 合法请求返回成功状态码、正确错误码与关键字段 |
| `success_with_optional_fields` | 有可选参数时 | 可选字段参与时仍返回正确结果 |
| `success_with_multi_record_or_complex_payload` | 批量或复杂对象时 | 复杂请求体、数组、嵌套对象、批量场景成功 |

## 反例

| scene | 何时必填 | 说明 |
| --- | --- | --- |
| `parameter_validation` | 必填 | 缺参、格式错误、非法值、越界输入 |
| `auth_permission` | 按需 | 未登录、token 失效、越权访问 |
| `business_error` | 必填 | 非法状态、资源不存在、重复操作等业务失败 |
| `idempotent_or_duplicate` | 写接口按需 | 重复提交、重复消费、幂等键冲突 |
| `dependency_failure` | 有依赖时 | 远端服务、缓存、消息、文件服务失败 |
| `security_or_sensitive_field` | 涉及敏感数据时 | 响应不泄漏敏感字段、非法字段不被接受 |
| `regression` | 修缺陷或改逻辑时 | 对应历史缺陷复现与回归 |

## 边界

| scene | 何时必填 | 说明 |
| --- | --- | --- |
| `null_or_empty` | 必填 | 空字符串、空数组、空对象、null |
| `min_max_limit` | 有长度或范围时 | 最小值、最大值、超界值 |
| `critical_state` | 有状态流转时 | 临界状态、终态、前后置状态切换 |
| `pagination_or_filter_boundary` | 列表或搜索时 | 页码、页大小、空结果、极限过滤组合 |
| `special_character_or_format` | 格式类字段时 | 特殊字符、大小写、时间格式、URL/邮箱/手机号等 |

## 并发

| scene | 何时必填 | 说明 |
| --- | --- | --- |
| `concurrent_request` | 写接口、幂等接口、抢锁链路按需，但必须显式判断 | 同一业务键或资源被并发请求时，验证最多一次有效写入、结果一致或冲突被正确拦截 |
| `multi_instance_concurrency` | 依赖分布式锁、唯一约束、幂等表、共享缓存锁等跨实例协调时必填；其它共享资源写链路按需显式判断 | 模拟多个服务实例同时处理同一业务键，验证跨实例不重复写入、不破坏状态顺序 |

说明：

1. `multi_instance_concurrency` 不要求真实启动多个 Spring Boot 进程；可通过共享锁 mock、唯一约束桩、两个 endpoint/service 实例共享同一依赖并发调用等方式模拟。
2. 若目标接口为纯只读、无共享资源竞争，`concurrent_request` 或 `multi_instance_concurrency` 可以写 `not_applicable`，但禁止静默省略。

## 实现分支清单

生成测试方法前，必须先枚举实现分支。最少检查以下分支类型：

| branchType | 何时必填 | 说明 |
| --- | --- | --- |
| `entry_guard` | 必填 | 入口参数、上下文、前置状态校验；需要区分通过与阻断分支 |
| `success_path` | 必填 | 主成功路径；至少覆盖一条完整主链 |
| `optional_noop` | 有可选参数、短路返回、可跳过步骤时 | 例如 `targetOrgCode=null` 跳过组织解析 / 入组，或命中本地已有记录直接短路 |
| `local_consistency_guard` | 有本地查重、唯一性、脏数据保护、更新条数判断时 | 例如重复记录、`userId` 为空、`update<=0`、同联系方式命中多条 |
| `dependency_call` | 有第三方 / 共享依赖 / DAO 查询写入时 | 每个调用点至少枚举成功与可达失败形态；失败形态优先拆成 `null/empty/false`、`business_exception`、`runtime_exception` |
| `post_side_effect` | 有授权、入组、落库、异步任务等后置步骤时 | 要覆盖“前序成功、后序失败”导致整体回滚或阻断的分支 |
| `concurrency_control` | 有锁、幂等键、唯一约束、多实例竞争时 | 至少检查“竞争失败 / 未拿到锁”和“被中断 / 抛异常”的并发分支 |

补充要求：

1. `dependency_call` 按调用点拆分，不得用“一条依赖失败”概括所有外部依赖。
2. `post_side_effect` 不得只覆盖“最终成功”；若主链存在“建号成功后再授权/入组/异步”的步骤，至少要有一个后置失败 case。
3. `optional_noop` 必须作为单独分支显式覆盖。
4. 若某个分支类型整体不适用，必须在交付说明中写明原因。
