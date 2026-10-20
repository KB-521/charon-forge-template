# YApi MCP Sync Rules

## 适用场景

通过本地 MCP 将 Spring Boot `**Endpoint` 字段级契约同步到 YApi 时读取。

## 命中条件

| 维度 | 命中信号 |
| --- | --- |
| 产物 | YApi 接口文档、分类、字段级 schema、upsert 结果 |
| 动作 | 扫描 Endpoint、解析字段、创建分类、上传或更新接口 |
| 风险 | 空壳 schema、重复接口、Controller 不支持、token 泄露 |
| 可跳过 | 不执行 YApi 同步 |

## 决策表

| 场景 | 规则 |
| --- | --- |
| MCP 可用 | 通过本地 MCP 查询项目、分类并 upsert |
| MCP 不可用 | 直接失败，不降级脚本或 HTTP 直连 |
| Endpoint | 只处理 `**Endpoint` 且仅处理 `@RestController` 类 |
| Controller | 手工同步、改造为 Endpoint，或先扩展本 skill |
| 分类 | 每个 Endpoint 单独成一个分类，除非用户明确要求合并 |

## 门禁

- 请求和响应必须展开字段级结构；`@RequestBody` 生成完整 JSON Schema。
- 响应 `data` 或直接返回对象必须展开泛型字段；`Boolean / Void` 除外。
- 未解析类型或字段进入失败清单，不能带空结构上传。
- token/projectId 默认走本地 MCP 配置，禁止写入仓库或日志。
- Endpoint、DTO/VO、字段注释、错误码和分类必须来自源码、API 契约或已确认输入；缺少来源时输出缺口。
- 只同步当前任务命中的 Endpoint，不顺手重排无关分类或覆盖无关接口。
- 涉及旧接口、旧客户端或字段兼容时必须说明兼容、回滚和剩余风险。

## 交付要求

| 项 | 必填内容 |
| --- | --- |
| 扫描范围 | 模块、Endpoint 路径和处理数量 |
| 分类映射 | Endpoint -> 分类名 -> catid |
| 接口结果 | 新增、更新、跳过和失败清单 |
| 字段解析 | request/response schema 完整性 |
| 安全 | token/projectId 未落入仓库或日志 |
| 交付证据 | 命中规则、MCP 操作结果、失败清单和剩余风险 |

## 高风险反例

- 上传空 request/response schema。
- Controller 入口误判为可自动同步。
- MCP 不可用时绕过配置直连 YApi。
