# Tenant Open Access

## 适用场景

生成或修改涉及租户、组织、用户上下文、open 链路、跨租户查询、全局扫描、调度扫描、公开入口或线程上下文的业务实现时读取。

## 命中条件

| 维度 | 命中信号 |
| --- | --- |
| 产物 | Service、Facade、Job、MQ、EventHandler、上下文处理 |
| 动作 | 当前租户读写、跨租户查询、公开访问、异步处理、远程调用 |
| 风险 | 租户越权、上下文泄漏、open 豁免不明、全表扫描、公开写接口缺保护 |
| 可跳过 | 不涉及用户、租户、组织、open、异步或公开链路 |

## 决策表

| 场景 | 业务层判断 | 默认调用 | 禁止事项 |
| --- | --- | --- | --- |
| 当前租户读写 | 数据属于当前请求或线程租户 | 普通 Service/Manager/DAO | 手动拼 tenantId 绕过上下文 |
| 当前租户复杂查询 | 查询不会越权且租户条件可下推 | 普通 Manager/DAO 或已确认查询方法 | 查全量后内存过滤租户 |
| 跨租户查询 | 有明确授权、数据范围和字段边界 | 优先 OpenService | 普通 DAO 扫全租户 |
| 全局/调度扫描 | 明确范围、分页、限流、幂等和失败恢复 | OpenService/OpenDAO/OpenMapper | 无边界全表扫描 |
| open 查询 | 确认可公开字段、白名单和越权保护 | OpenService 或 open 链路封装 | 复用内部 DAO 暴露敏感字段 |
| 跨租户写入 | 默认高风险，必须有设计依据和授权 | 已确认业务服务或专项 open 写能力 | Service 内切租户后直接写 DAO |

## 优先级

1. 当前租户内能完成的，使用普通 Manager/DAO，并依赖项目既有租户上下文。
2. 跨租户、全局扫描、调度扫描或 open 查询，优先使用 OpenService。
3. 没有 OpenService 但存在 OpenDAO/OpenMapper 时，必须确认既有项目约定、白名单依据和调用边界。
4. 缺少对应 open SQL 文件时，转 `server/persistence-impl`；缺少 OpenDAO/OpenMapper/Manager 骨架时，转 `server/skeleton-codegen`，不在业务层临时绕过。
5. 禁止在 Service 内手动拼接租户条件、切换线程租户后不清理、绕过租户隔离。

## 交付要求

| 项 | 必填内容 |
| --- | --- |
| 访问范围 | current-tenant / cross-tenant / global-scan / open |
| 租户来源 | 请求上下文 / 消息体 / 调度配置 / 外部回调 / 已确认输入 |
| 调用能力 | 普通 Manager/DAO / OpenService / OpenDAO / OpenMapper |
| 授权依据 | PRD / 设计 / 现有代码 / 已确认决策 |
| 隔离与清理 | 上下文传递、ThreadLocal 清理、异常路径 |
| 风险 | 越权、全表扫描、脏写、敏感字段泄露、重试重复 |

## 高风险反例

- 因为接口叫 open 就跳过租户校验。
- 普通 DAO 查询跨租户数据。
- 线程池复用 ThreadLocal 导致串租户。
- 调度任务无分页、无限制扫描全量数据。
