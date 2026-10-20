---
name: d2c
description: 基于 Figma 链接，仅使用 Figma 官方 API 获取 2x 截图与 depth=10 节点 JSON，逐节点还原 React + Tailwind 页面并输出可追溯实现清单、节点映射与计算依据。用于设计稿高保真还原、UI 对齐修复与可审计交付。
version: 1.0.0
owners:
  - dachui
---

# D2C 页面实现（Figma API Only）

按“先取证再实现”的方式将 Figma 设计稿还原为前端页面。实现必须可追溯到截图与 JSON 数据，禁止凭经验猜测视觉与结构。

## 前置约定

1. Token 来源：优先读取 `agent.config` 中 `Figma-Token` 或 `FIGMA_TOKEN`，其次读取环境变量 `FIGMA_TOKEN`。
2. 只允许使用 Figma 官方 API：`/v1/images` 与 `/v1/files/{file_key}/nodes`。禁止依赖中转 parse 服务或第三方结构化脚本结果。
3. 实现前先从 Figma 链接解析 `fileKey` 与 `nodeId`，并统一将 `nodeId` 转换为冒号格式（如 `5907:8014`）。

## 强制流程（必须按顺序）

```
Figma 链接
  -> Step 1. 导出 2x 视觉基准图
  -> Step 2. 获取 Figma 结构化 JSON
  -> Step 3. 生成节点实现清单
  -> Step 4. 逐节点实现与勾选
  -> Step 5. 自检与交付
```

### Step 1. 导出 2x 视觉基准图

1. 开始实现前必须导出目标节点 2x 截图并保存到 `figma-data/<nodeId>-@2x.png`。
2. 必须调用：
`GET https://api.figma.com/v1/images/<fileKey>?ids=<nodeId>&format=png&scale=2`
3. 先从响应 JSON 的 `images[<nodeId>]` 提取图片 URL，再下载落盘。
4. 后续所有实现与验收都必须以该截图为视觉基准。

### Step 2. 获取 Figma 结构化 JSON

1. 必须调用：
`GET https://api.figma.com/v1/files/<fileKey>/nodes?ids=<nodeId>&depth=10`
2. 必须获取完整层级（`depth=10`），禁止只看浅层节点。
3. JSON 必须原样保存到 `figma-data/node-<nodeId>-raw.json`，用于后续可追溯验收。
4. 解析重点字段：`children`、`absoluteBoundingBox`、`fills`、`effects`、`layoutMode`、`itemSpacing`、`cornerRadius`、`style`。

### Step 3. 生成节点实现清单

1. 从 JSON 枚举所有一级子节点（`name + id`），按出现顺序生成实现清单。
2. 每个节点必须有状态：`完成` 或 `未完成 + 原因`，禁止遗漏。
3. 实现前执行“双校验”：
- JSON 用于判断结构、尺寸、坐标、色值。
- 2x 截图用于判断元素是否属于最终视觉结果。
- 对截图明确不需要的噪音节点，标记 `跳过 + 理由`。
4. 编码前输出“颜色记录表”：将关键节点 `fills` 色值转换为十六进制或 Tailwind token，后续实现必须只引用该表。

### Step 4. 逐节点实现与勾选

针对清单中的每个节点，按顺序执行：

1. 深度解析节点 `children`，避免把复杂容器误当作单图。
2. 读取 `absoluteBoundingBox`、`fills`、`effects`，先记录计算依据再编码。
3. 资源处理：
- 图片资源（存在 `imageRef`）或者以 image_ 开头的节点：`GET /v1/images/{file_key}?ids={node_ids}&format=png&scale=2`
- SVG 图标：`GET /v1/images/{file_key}?ids={node_ids}&format=svg`
- 以 icon_xxx 开头的节点：`GET /v1/images/{file_key}?ids={node_ids}&format=svg`
- 以 logo_xxx 开头的节点：`GET /v1/images/{file_key}?ids={node_ids}&format=png&scale=2`
- 从响应 `images` 字段提取 URL，下载到 `assets/` 并使用语义化命名。
4. 使用 React + Tailwind 实现节点结构，优先复用 `src/components` 组件。
5. 无需额外做响应式/断点适配，默认严格还原当前设计稿尺寸与布局。
6. 每完成一个节点，立刻在清单勾选状态，并登记“节点 -> 代码位置”。

### Step 5. 自检与交付

提交结果必须同时包含：

1. 一级子节点清单及状态（完成 / 未完成 + 原因 / 跳过 + 理由）。
2. 节点实现对照表（节点 -> React 文件/位置）。
3. 关键间距、色值、排版计算说明（引用 JSON 原始坐标与颜色值）。

## 计算与实现规则

1. 布局优先 `Flex`，仅装饰元素或特殊场景使用 `Absolute`。
2. 间距计算必须可追溯：
- `gap = next.(x/y) - (current.(x/y) + current.(width/height))`
- `padding = child.(x/y) - parent.(x/y)`
- `margin = current.(x/y) - (prev.(x/y) + prev.(width/height))`
3. 色值转换：
- Figma 浮点色值（0-1）转换为整数 RGB：`(r*255, g*255, b*255)`
- 透明度：`a*100%`
4. 数值统一四舍五入为整数，不保留小数。
5. 样式必须使用 Tailwind，禁止内联 `style`。
6. 精确值使用 Tailwind 任意值语法（如 `[123px]`）。
7. 文案必须与设计稿完全一致，不得改写。
8. 按钮宽度禁止写死，使用 `padding` 撑开。
9. 能抽取的重复节点必须抽取循环逻辑，避免重复硬编码。

## 异常处理

1. 下载资源遇到 CA 证书问题时，统一执行：
`mkdir -p <目标目录> && curl -L "<image-url>" -o <目标目录>/<文件名> --insecure`
2. 如遇 `403 Token expired` 或 `401 Unauthorized`，先终止实现并要求更新 token，禁止基于猜测继续编码。
3. 无法在当前迭代实现的节点，必须保留在清单中并标注“未完成 + 原因”。

## 门禁（Gate）

- Gate 1：未完成 Step 1 和 Step 2，禁止开始编码。
- Gate 2：未生成节点实现清单与颜色记录表，禁止开始逐节点实现。
- Gate 3：节点状态未闭环（完成/未完成/跳过），禁止交付。
- Gate 4：最终输出缺少“节点清单 + 对照表 + 计算依据”任一项，禁止交付。

## 最小输出模板

```markdown
## 节点清单
| 节点 | ID | 状态 | 备注 |
| --- | --- | --- | --- |

## 节点实现对照表
| 节点 | 代码位置 |
| --- | --- |

## 关键计算依据
- 间距：
- 色值：
- 排版：
```

## 自检清单

- 是否识别了全部子元素，避免把复杂节点误当单图？
- 是否全部使用 Tailwind 类名并避免内联样式？
- 是否逐条回查颜色记录表，未凭经验猜色？
- 是否逐节点核对了文案、字重、字号与颜色？
- 是否优先使用 Flex，且仅在必要处用 Absolute？
- 是否存在遗漏元素或错误跳过？
- 是否复用已有通用组件而非重复实现？
- 是否对可重复结构提取了循环逻辑？
- 是否附带节点实现对照表并逐项确认状态？
