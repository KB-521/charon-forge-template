---
name: api-impl
description: 基于 YAPI MCP 或指定文档输入，按项目规范实现前端 API 接口（目录、命名、类型、request 封装）
version: 1.1.0
owners:
  - dachui
---

# API 接口实现 Skill

先确定接口输入来源，再严格遵守以下规则完成接口编写。任何违反规则的输出都被视为错误。

## 输入来源规则
1. 输入可以来自以下任一来源：
   - `yapi mcp` 获取的接口定义。
   - 用户直接引用的文件（本地文件路径、仓库文档、PRD、接口说明等）。
2. 若用户明确指定了输入文件，必须以该文件为主，不得强制改为 yapi。
3. 若用户未提供可用文件，而是输入了 yapi 的链接，再使用 `yapi mcp` 获取接口信息。
4. 如果没有任何输入，则视为错误输入，直接终止流程

## 目录结构规则
1. 所有 API 必须放在 `src/api/` 下。
2. 每个模块必须有自己的文件夹，例如：`user/`、`credit/`、`tools/`。
3. 每个接口必须是“单文件闭环”：同一个文件中同时包含该接口函数和该接口相关类型。
4. 文件名必须使用接口请求函数名（例如：`requestQueryPartnerPage.ts`）。
5. `index.ts` 仅可选用于导出聚合；若存在，禁止在其中实现接口逻辑或声明业务类型。
6. 模块内禁止使用集中式 `type.ts` 维护该模块全部接口类型。
7. 若接口无法归类到已有模块，必须创建新的子目录。

## 命名规则

### 目录命名
1. 目录名称必须使用小写字母。
2. 目录名称必须基于业务模块，例如：`login`、`sso`、`image`。

### 文件命名
1. 每个接口文件名必须与请求函数名一致，例如：`requestCreateTask.ts`。
2. 若使用 `index.ts`，仅用于 `export * from './requestXxx'` 聚合导出，不承载实现。

### 函数命名
1. 所有 API 函数必须以 `request` 开头。
2. API 函数命名格式：`requestXxxYyyZzz`（驼峰）。
3. 命名必须遵循“动词 + 名词”形式，例如：
   - `requestExecuteTask`
   - `requestQueryOneTask`

### 类型命名
1. 请求类型以 `XxxReq` 结尾，例如 `CreateTaskReq`。
2. 响应类型以 `XxxRes` 结尾，例如 `TaskDetailRes`。
3. 参数类型以 `XxxParams` 结尾，例如 `QueryOneTaskParams`。
4. 枚举使用 `PascalCase`。

## 类型定义规则
1. 所有 API 请求和响应必须使用 TypeScript 类型。
2. 类型必须定义在对应接口文件内（与该接口函数同文件）。
3. 类型定义必须只包含业务字段，不得包含框架通用字段。
4. 所有 `interface` 的每一个字段都必须有详细注释（`/** ... */`），禁止遗漏。

禁止：

- 声明 `requestid`、`code`、`message` 等通用响应字段。

类型定义示例按需读取 `references/code-examples.md`。

## API 函数规则
1. 所有 API 必须使用 `request` 函数封装，不允许直接使用 `fetch`。
2. API 请求必须使用泛型 `<ResponseType>` 指定响应类型。
3. API 函数结构必须保持一致；示例按需读取 `references/code-examples.md`。

## 文档注释规则
1. 每个接口函数必须包含 JSDoc 注释。
2. 注释必须包含：
   - 功能说明
   - 参数说明
   - 返回值说明

## 禁止事项
1. 禁止把“通用响应结构”写入业务类型。
2. 禁止使用集中式 `type.ts` 存放整个模块的接口类型。
3. 禁止生成“使用示例”或“使用文档”。
