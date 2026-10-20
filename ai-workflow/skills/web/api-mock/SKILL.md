---
name: api-mock
description: 为接口提供本地 mock/假数据联调能力。用于“mock 接口 / 假数据 / 本地联调 / stub 后端 / 离线开发”。
version: 1.0.0
owners:
  - dachui
---

# API Mock

在不改页面调用方式的前提下，通过请求层“命中即 mock，未命中走真实接口”的策略接入本地 mock。

## 落点（先读）

- 请求入口（在此接入 mock 分发逻辑）：`src/lib/request.tsx`
- mock 路由注册：`src/mock/index.ts`（`mockRoutes` 聚合）
- mock 路由表：按 api 目录拆分（如 `src/mock/main-task/`）
- 每个接口一个文件，**文件名使用接口函数名**（kebab-case），模块内用 `index.ts` 聚合
- mock 类型定义：`src/mock/types.ts`

## 快速使用

1) 盘点需要 mock 的接口（必须完整列清单）

推荐命令：

```bash
rg "url:\\s*['`]" src/api -n
```

输出“method + path + 对应 type 文件位置”的实现清单。

2) 每个接口实现到独立文件 `src/mock/<api-module>/<request-function-name>.ts`

- 用 `method + match(url, config)` 匹配（`url` 为 pathname）
- 动态路径用 `startsWith` + 解析最后一段
- 返回值必须是 **接口定义类型** 的形状（严格对齐 `type.ts`），不要再包 `{ code, data }`
- 推荐在 handler 里直接 import 对应的响应类型并赋值，避免字段遗漏或类型不匹配
- **当接口有明确字段定义时，mock 中尽量覆盖所有字段**（尤其是 UI 可能使用的字段）

3) 模块内聚合，再注册到全局

- 在 `src/mock/<api-module>/index.ts` 导出该模块 routes
- 将模块 routes 注册到 `src/mock/index.ts`

```ts
import { fooRoutes } from './foo';

const mockRoutes: MockRoute[] = [...mainTaskRoutes, ...fooRoutes];
```

最小模板：

```ts
import type { ExampleRes } from '@/api/example/type';

{
  method: 'GET',
  match: (url, config) => url === '/example/path',
  description: 'example handler',
  handler: (config) => ({ ok: true }),
}
```

## 约束与注意事项

- 缺少 handler 时会直接走真实接口；因此 mock 清单必须完整。
- 请求层会先尝试 `tryMockRequest`，命中后直接返回 handler 结果，不会走接口包裹层。
- 不要凭空添加字段；有字段就按 `type.ts` 的注释补齐数据范围和含义。
- 优先复用已有 type（`src/api/**/type.ts`），避免“看起来能跑但结构不对”。
- mock 是请求层能力，不要把 mock 数据散落在页面组件里。
- 业务字段（如 `taskStatus`）优先从项目常量（如 `TASK_STATUS`）取值，避免自造枚举。
- **不同接口之间不要复用 mock 数据生成器**，每个接口文件独立构造数据，避免耦合。

## 验证

尽量做最小验证：

```bash
npx eslint src/mock src/lib/request.tsx
```

然后在 App 内实际打开对应页面确认渲染和交互。命中 mock 时会有 `[MOCK]` 日志输出。
