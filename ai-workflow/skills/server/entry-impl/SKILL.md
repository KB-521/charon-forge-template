---
name: entry-impl
description: 实现后端对外入口层，包括 Endpoint/Controller、Request DTO、Response VO、路由、参数绑定、校验注解、鉴权/审计注解、响应封装和 API 契约对齐；只做协议适配并调用已确认 service，不承接业务规则、事务或持久化实现。
version: 1.0.0
owners:
  - sunwencong
---

# 后端对外接口层实现

## 目标

把已确认的 service 能力和 API 契约落成对外 HTTP 入口，保持入口层轻薄、字段级契约清晰，并可交给 YApi 同步。

默认优先使用项目既有 `Endpoint` 风格；历史模块确认为 `Controller` 风格时可继续使用 `Controller`，但必须在交付中说明 YApi 自动同步是否支持。

## 命中场景

- 新增或修改 Endpoint/Controller。
- 新增或修改 Request DTO、Response VO、分页响应、路径参数、查询参数、请求体。
- 补齐路由、HTTP method、参数校验、鉴权/审计注解、响应封装。
- service 已实现，需要暴露 API 或对齐 API 契约/YApi。

## 不适用场景

- Service 业务规则、事务、幂等、状态机、外部能力调用：转 `server/req-impl`。
- DDL、DML、schema delta、history compat、rollback/fixforward SQL 文件：转 `server/persistence-impl`。
- DAO/Mapper/Manager/PO/Query、generator、OpenDAO/OpenMapper 等 Java 持久化骨架：转 `server/skeleton-codegen`。
- 数据模型、字段语义、索引策略或兼容口径设计：转 `server/data-model-design`。
- YApi 实际上传：转 `server/yapi-mcp-sync`。

## 输入

- `server/backend-design` 的 API 契约或已确认接口字段。
- `server/req-impl` 输出的 service 方法签名、错误语义、权限边界和返回模型。
- 目标项目 Endpoint/Controller 样板、响应封装、校验和鉴权约定。

## 读取顺序

1. 读取目标项目 `AGENTS.md` 或等价说明，确认入口模块边界。
2. 读取 `references/rules/INDEX.md`，按“规则索引”命中入口层规则。
3. 读取 `references/entry-checklist.md` 做字段级契约和入口门禁检查。
4. 用 `rg` 查相似 Endpoint/Controller、DTO/VO、ResponseDTO、ControllerAdvice、鉴权/审计注解。

## 执行顺序

1. **契约冻结**
- 确认 API path、method、request、response、错误码、鉴权和兼容影响。
- 缺 service 方法或业务语义时，先转 `server/req-impl`。

2. **入口适配**
- 新增或修改 Endpoint/Controller、DTO、VO、参数绑定、校验注解、响应封装。
- 入口层只做协议适配、基础校验和 service 调用，不堆业务规则。

3. **契约自检**
- request/response 字段与 API 契约逐项对齐。
- 输出入口契约：API、Method、Request、Response、鉴权/权限、校验、错误映射、调用 Service 和 YApi 支持状态。
- 输出 YApi 同步建议；实际同步由 `server/yapi-mcp-sync` 执行。当前 YApi 自动同步默认只支持 `**Endpoint`，若本次使用 `**Controller`，必须标注为需手工同步或先扩展 `server/yapi-mcp-sync`。

## 门禁

- 未确认 service 能力和字段级 API 契约，禁止新增入口。
- Endpoint/Controller 不直接访问 DAO/Mapper。
- 入口层不承接核心业务状态机、事务、外部调用和复杂补偿。
- 对外返回不得泄露敏感字段、内部异常栈、内部配置或 token。

## 交付

- API 契约引用和字段对齐结论。
- Endpoint/Controller、DTO、VO 修改文件。
- 调用的 service 方法。
- 鉴权、校验、响应封装和兼容影响。
- 验证命令、结果或未执行原因。
- Entry API Contract。
- 是否需要 `server/yapi-mcp-sync`；若入口是 `Controller`，说明自动同步缺口或替代方案。
