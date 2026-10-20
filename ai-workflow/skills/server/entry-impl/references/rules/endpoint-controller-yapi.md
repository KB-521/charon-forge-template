# Endpoint Controller YApi

## 适用场景

新增或修改 Endpoint、Controller、路由、HTTP method、入口类归属或 YApi 同步建议时读取。

## 命中条件

| 维度 | 命中信号 |
| --- | --- |
| 产物 | Endpoint、Controller、路由、YApi 同步建议 |
| 动作 | 新增入口、修改路由、调整入口类型、准备同步 YApi |
| 风险 | 入口归属不清、重复入口、YApi 自动同步缺口 |
| 可跳过 | 不涉及 HTTP 入口 |

## 决策表

| 场景 | 默认选择 | 说明 |
| --- | --- | --- |
| 新编排入口 | Endpoint | 跨资源编排、批处理、导入导出、异步触发 |
| 历史资源 CRUD | 既有 Controller 风格 | 必须符合项目现有模块约定 |
| 需要自动 YApi | Endpoint | `yapi-mcp-sync` 当前仅自动处理 `**Endpoint` |
| Controller 入口 | 可兼容历史 | 需手工同步 YApi、改造成 Endpoint，或先扩展同步 skill |

## 门禁

- Endpoint/Controller 只做协议适配、基础参数校验、上下文提取、响应封装和 service 调用。
- Endpoint/Controller 不直接访问 DAO/Mapper。
- 不得同一动作同时新增重复 Endpoint 和 Controller。

## 交付要求

| 项 | 必填内容 |
| --- | --- |
| 入口类型 | Endpoint / Controller 和选择依据 |
| 路由 | class/method mapping、HTTP method |
| 调用 Service | 方法名、入参转换和返回转换 |
| YApi | 是否可自动同步；Controller 缺口或替代方案 |

## 高风险反例

- Controller 中堆复杂业务判断。
- 新入口使用 Controller 导致 YApi 自动同步断链但未说明。
- Endpoint 直接调用 DAO。
