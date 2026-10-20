---
name: yapi-mcp-sync
description: 仅通过本地 MCP 将 Spring Boot `**Endpoint` 接口按字段级契约上传到 YApi；支持扫描、解析、分类、幂等 upsert 和失败汇总。
version: 1.2.0
owners:
  - sunwencong
---

# YApi MCP 同步

## 目标

- 仅扫描 Spring Boot `**Endpoint` 接口。
- 提取字段级请求/响应契约后，通过本地 YApi MCP 新增或更新接口文档。
- 默认按 `method + path` 幂等 upsert，避免重复接口。

## 适用场景

- Endpoint 已开发完成，需要同步或补齐 YApi。
- 批量补齐历史 Endpoint 文档。
- 需要按 Endpoint 自动分组分类并保持重复执行可更新。
- 若业务入口是 `**Controller`，本 skill 不自动处理；应先改造为 Endpoint、手工同步，或另行扩展本 skill 的 Controller 解析能力。

## 最小输入

- 目标模块。
- Endpoint 扫描路径。
- 可选：分类名前缀、覆盖 `projectId`、仅预览不上传。

## 前置检查

- 必须先验证本地 YApi MCP 可调用。
- MCP 不可用时直接失败；禁止降级到脚本或 HTTP 直连。
- `token` / `projectId` 默认走本地 MCP 配置，禁止写入仓库或日志。

## 执行流程

1. 扫描 `src/main/java/**/*Endpoint.java`，且仅处理 `@RestController` 类。
2. 按 Endpoint 计算分类：一个 `XxxEndpoint` 对应一个 YApi 分类。
3. 解析类级和方法级路由，得到完整 `path + method`。
4. 解析方法标题：优先注释、`@ApiOperation/@Operation`，否则回退方法名。
5. 提取请求字段：`@PathVariable`、`@RequestParam`、`@RequestHeader`、`@RequestBody` 及递归字段。
6. 提取响应字段：展开 `ResponseDTO<T>`、`PageSerializable<T>`、`List<T>`、`VO/PO` 与继承链字段。
7. 组装 YApi 文档模型：`title/path/method/req_* /res_body/catid`。
8. 通过本地 MCP 查项目、查分类、按需建分类，并按 `method + path` 更新或新增接口。
9. 输出扫描、解析、上传和失败统计。

## 硬门禁

- 自动同步只处理 `**Endpoint`；`**Controller` 需手工同步、改造为 Endpoint，或先扩展本 skill。
- 每个 Endpoint 单独成一个分类；除非用户明确要求，不能合并到默认分类。
- 请求和响应必须是字段级契约；禁止上传空壳 schema。
- `@RequestBody` 必须生成完整 JSON Schema。
- 响应 `data` 或直接返回对象必须展开到字段级；`Boolean / Void` 除外。
- 默认严格模式：存在未解析类型或字段时，该接口进入失败清单，不能带空结构上传。
- `req_body_is_json_schema` 和 `res_body_is_json_schema` 默认都为 `true`。

## 按需读取

- 规则入口读 `references/rules/INDEX.md`。
- 字段解析、完成标准、失败处理和输出要求读 `references/sync-checklist.md`。

## 能力边界

- 仅支持标准 Spring Mapping 注解写法。
- 仅走本地 MCP 调用，不回退脚本或 HTTP 直连。
- 字段解析只基于 Java 源码静态信息，不执行运行时反射。
- 与 `server/entry-impl` 的关系：entry 层可按历史项目风格实现 Controller，但本 skill 的自动同步边界仍是 Endpoint-only。
