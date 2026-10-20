---
name: rn-d2c
description: 基于 Figma 链接还原 React Native Expo 页面，使用 NativeWind 并输出可追溯节点清单、节点映射与计算依据。用于“设计稿转 RN 代码 / Figma to React Native / App D2C 高保真还原”场景。
version: 1.0.0
---

# RN D2C 页面实现（Figma API Only）

按“先取证再实现”的方式将 Figma 设计稿还原为 React Native 页面。实现必须可追溯到截图与 JSON 数据，禁止凭经验猜测视觉与结构。

## 常见偏差原因（复盘沉淀）

以下属于历史高频偏差来源，执行时必须主动规避：

1. 执行顺序偏差：先“跑通页面”再“视觉精修”，导致第一版结构正确但视觉细节失真。
2. 证据链断裂：未在编码前完整落地“节点清单 + 颜色记录表 + 微参数记录”，实现阶段转为经验判断。
3. 替代实现偏差：用通用图标或近似样式替代 Figma 装饰节点（星星、光环、角标、发光），几何与光效不一致。
4. 验收闭环不足：缺少逐节点视觉对照与偏差清单，导致小数值边框、1-2px 位移、阴影参数等漏修。
5. 资源边界偏差：直接导出带 `effects` 的图标容器，导致阴影被烘进 PNG 透明边界，后续布局尺寸和对齐难以还原。

## 反偏差硬规则（必须执行）

1. 禁止“先可运行、后精修”策略。必须先完成 Step 1-3，再进入任何编码动作。
2. 装饰性矢量节点（星形、光环、角标、发光、粒子）禁止用通用 icon 库替代；必须使用 Figma 导出 SVG 或按 Figma 参数绘制 SVG。
3. 涉及微视觉参数的节点（边框 <= 1px、位移 <= 2px、阴影/渐变 stop/旋转）禁止近似取整，必须保留 Figma 小数。
4. 每次提交前必须输出“视觉偏差清单（已对齐/待对齐）”，没有清单视为未完成。
5. 带 `DROP_SHADOW` / `LAYER_BLUR` / `BACKGROUND_BLUR` 的 icon 容器禁止默认整节点导出为 PNG；必须先判断阴影是否应由 RN/CSS 样式实现，并优先拆成“干净图标资源 + 代码背景/阴影容器”。

## 前置约定

1. Token 来源：优先读取 `agent.config` 中 `Figma-Token` 或 `FIGMA_TOKEN`，其次读取环境变量 `FIGMA_TOKEN`。
2. 只允许使用 Figma 官方 API：`/v1/images` 与 `/v1/files/{file_key}/nodes`。如需额外生成简化结果，可作为辅助，但禁止依赖中转 parse 服务或第三方结构化脚本结果替代 raw JSON。
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
4. 如流程要求可额外调用 parse 服务生成简化 JSON，但不得替代 raw JSON。
5. 解析重点字段：`children`、`absoluteBoundingBox`、`fills`、`effects`、`layoutMode`、`itemSpacing`、`cornerRadius`、`style`。

### Step 3. 生成节点实现清单

1. 从 JSON 枚举所有一级子节点（`name + id`），按出现顺序生成实现清单。
2. 每个节点必须有状态：`完成` 或 `未完成 + 原因`，禁止遗漏。
3. 实现前执行“双校验”：

- JSON 用于判断结构、尺寸、坐标、色值。
- 2x 截图用于判断元素是否属于最终视觉结果。
- 对截图明确不需要的噪音节点，标记 `跳过 + 理由`。

4. 编码前输出“颜色记录表”：将关键节点 `fills` 色值转换为十六进制或 token，后续实现必须只引用该表。

### Step 4. 逐节点实现与勾选

针对清单中的每个节点，按顺序执行：

1. 深度解析节点 `children`，避免把复杂容器误当作单图。
2. 读取 `absoluteBoundingBox`、`fills`、`effects`，先记录计算依据再编码。
3. 资源处理：

- 图片资源（存在 `imageRef`）或者以 image\_ 开头的节点：`GET /v1/images/{file_key}?ids={node_ids}&format=png&scale=2`
- SVG 图标：`GET /v1/images/{file_key}?ids={node_ids}&format=svg`
- 以 icon_xxx 开头的节点：`GET /v1/images/{file_key}?ids={node_ids}&format=svg`
- 以 logo_xxx 开头的节点：`GET /v1/images/{file_key}?ids={node_ids}&format=png&scale=2`
- 从响应 `images` 字段提取 URL，下载到 `assets/` 并使用语义化命名。
- 如果图标节点自身包含 `effects`，先拆解节点层级：将圆形/矩形背景、阴影、内部图标分别建模；内部干净图标可单独导出 PNG/SVG，背景色、圆角、阴影使用 RN/CSS 样式实现，避免导出带阴影透明边界的 PNG。

4. 使用 React Native + Expo + NativeWind 实现节点结构，优先复用 `app/src/components` 组件。
5. 无需额外做断点响应式，默认严格还原当前设计稿尺寸与布局。
6. 每完成一个节点，立刻在清单勾选状态，并登记“节点 -> 代码位置”。
7. 装饰性矢量节点必须对照对应 node 的 `fills/effects/strokes` 实现；禁止使用语义类似但视觉不一致的替代组件。

### Step 5. 自检与交付

提交结果必须同时包含：

1. 一级子节点清单及状态（完成 / 未完成 + 原因 / 跳过 + 理由）。
2. 节点实现对照表（节点 -> React Native 文件/位置）。
3. 关键间距、色值、排版计算说明（引用 JSON 原始坐标与颜色值）。
4. 视觉偏差清单（已对齐项 / 待对齐项 + 原因 + 下一步）。

## 计算与实现规则

1. 布局优先 `Flex`，仅装饰元素或特殊场景使用 `Absolute`。
2. 间距计算必须可追溯：

- `gap = next.(x/y) - (current.(x/y) + current.(width/height))`
- `padding = child.(x/y) - parent.(x/y)`
- `margin = current.(x/y) - (prev.(x/y) + prev.(width/height))`

3. 色值转换：

- Figma 浮点色值（0-1）转换为整数 RGB：`(r*255, g*255, b*255)`
- 透明度：`a*100%`

4. 数值默认四舍五入为整数；但边框、阴影、渐变 stop、旋转角度、1-2px 微位移必须保留 Figma 小数精度。
5. 样式优先使用 NativeWind `className`，仅在必要动态值处使用少量 `style`。
6. 精确值使用任意值语法（如 `[123px]`）。
7. 文案必须与设计稿完全一致，不得改写。
8. 按钮宽度禁止写死，使用 `padding` 撑开。
9. 能抽取的重复节点必须抽取循环逻辑，避免重复硬编码。
10. 仅使用 React Native 组件，禁止 DOM 标签（如 `<div>` / `<a>`）。

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
- Gate 5：未附“视觉偏差清单（已对齐/待对齐）”，禁止交付。

## 最小输出模板

```markdown
## 节点清单

| 节点 | ID  | 状态 | 备注 |
| ---- | --- | ---- | ---- |

## 节点实现对照表

| 节点 | 代码位置 |
| ---- | -------- |

## 关键计算依据

- 间距：
- 色值：
- 排版：

## 视觉偏差清单

- 已对齐：
- 待对齐：
```

## 自检清单

- 是否识别了全部子元素，避免把复杂节点误当单图？
- 是否全部使用 React Native 组件 + NativeWind 类名并避免大面积内联样式？
- 是否逐条回查颜色记录表，未凭经验猜色？
- 是否逐节点核对了文案、字重、字号与颜色？
- 是否优先使用 Flex，且仅在必要处用 Absolute？
- 是否存在遗漏元素或错误跳过？
- 是否复用已有通用组件而非重复实现？
- 是否对可重复结构提取了循环逻辑？
- 是否附带节点实现对照表并逐项确认状态？
- 是否附带“视觉偏差清单”，并确认没有遗漏的微视觉参数（边框/位移/阴影/渐变 stop）？
