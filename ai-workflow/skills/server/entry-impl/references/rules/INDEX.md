# Entry Impl Rules

对外接口层只加载本目录规则。

## 读取规则

- 先抽取入口层产物、动作、风险和缺口，再按“规则索引”只读取命中的本地规则文件。
- YApi 上传不在本 skill 内执行，完成后转 server/yapi-mcp-sync。
- 规则冲突时，以当前 skill 本地规则和已确认 API 契约为准。

## 规则索引

| 任务事实 | 读取规则 | 可跳过条件 |
| --- | --- | --- |
| API path、method、request、response、字段级契约、兼容影响 | `api-contract.md` | 不涉及 API 契约 |
| Request DTO、Response VO、分页响应、字段裁剪、模型转换 | `dto-vo-boundary.md` | 不新增或修改 DTO/VO |
| 参数校验、鉴权、权限、审计、上下文提取 | `validation-auth-audit.md` | 不涉及校验、权限、审计或上下文 |
| 响应封装、异常映射、错误码、分页/空结果 | `response-error.md` | 不涉及响应或错误语义 |
| Endpoint、Controller、路由、YApi 同步建议 | `endpoint-controller-yapi.md` | 不涉及 HTTP 入口 |
| 验证、交付、入口契约、剩余风险 | `delivery-gates.md` | 不可跳过 |
