# API Contract

## 适用场景

新增或修改 API path、method、request、response、错误码、兼容影响或字段级契约时读取。

## 命中条件

| 维度 | 命中信号 |
| --- | --- |
| 产物 | Endpoint/Controller 方法、API 契约、请求/响应字段 |
| 动作 | 新增接口、修改接口、调整字段、变更路由或 method |
| 风险 | 契约漂移、字段遗漏、HTTP 语义错误、兼容破坏 |
| 可跳过 | 不涉及 API 契约 |

## 决策表

| 场景 | 规则 |
| --- | --- |
| 新增 API | path、method、title、用途、request、response、错误码全部确认 |
| 修改 API | 说明新增、兼容修改、不兼容修改或废弃 |
| 字段级契约 | 字段展开到名称、类型、必填、默认值、校验、说明 |
| HTTP method | GET 只读，POST/PUT/PATCH/DELETE 按业务语义选择 |

## 门禁

- path、method、request、response、错误码和兼容影响必须来自 API 契约或已确认输入。
- 未确认 service 能力和字段级 API 契约，禁止新增入口。
- 对外返回不得泄露敏感字段、内部异常栈、内部配置或 token。

## 交付要求

| 项 | 必填内容 |
| --- | --- |
| API | path、method、title、用途 |
| Request | 字段级契约和参数来源 |
| Response | 字段级契约、分页或空结果语义 |
| 兼容 | 新增、兼容修改、不兼容修改或废弃 |

## 高风险反例

- 只写 DTO 类名，不展开字段。
- GET 接口执行写库或状态流转。
- 公开接口返回内部 PO。
