---
name: prd-archive
description: 通过语雀 Open API（非 MCP）拉取最新 PRD 并覆盖落库到 ai-workflow/sdd/changes/<change-id>/prd。
version: 1.0.0
owners:
  - dachui
  - sunwencong
---

## 输入

- `change-id`（必填）
- 原始 PRD 路径/语雀文档链接（必填）
- 目标文件名（可选，未提供时按源标题或源文件名生成）

## 接口拉取脚本（非 MCP）

- 脚本路径：`ai-workflow/skills/common/prd-archive/scripts/fetch_yuque_doc.py`
- 鉴权优先级：`--token` > 环境变量 `YUQUE_TOKEN`/`YUQUE_API_TOKEN` > 仓库根目录 `agent.config` 的 `YUQUE_TOKEN`/`YUQUE_API_TOKEN`
- 标题序号：`--format markdown` 时会自动结合 `body_html` 保留/补齐语雀标题自动编号（如 `1.`、`3.1.`、`4.2.1.`）
- 支持三种输入方式：
  - 语雀链接：`--url "https://www.yuque.com/<group>/<repo>/<slug>"`
  - 命名空间 + 文档标识：`--namespace "<group>/<repo>" --slug "<slug>"`
  - 文档 ID：`--doc-id "<id>"`
- 可选参数：`--repo-id "<book-id>"`（部分租户 API 需要 `repo_id` 路由；`--url/--namespace` 默认自动解析）
- 常用命令：

```bash
# 通过语雀链接拉取 Markdown
python3 ai-workflow/skills/common/prd-archive/scripts/fetch_yuque_doc.py \
  --url "https://www.yuque.com/xxx/yyy/zzz" \
  --format markdown \
  --output /tmp/prd.md

# 通过 namespace + slug 拉取
python3 ai-workflow/skills/common/prd-archive/scripts/fetch_yuque_doc.py \
  --namespace "xxx/yyy" \
  --slug "zzz" \
  --format markdown \
  --output /tmp/prd.md
```

## 工作流

0. 覆盖策略门禁（必做）
- 禁止在执行中对比“本地 PRD 与远端 PRD 是否相同”。
- 禁止因为“内容相同/差异很小”跳过写盘。
- 每次拉取都必须执行第 4 步“落库（覆盖更新）”。

1. 排除特定章节后提取
  - `变更记录`
  - `文档版本记录`
  - `竞品参考`
- 章节匹配按标题文本判断；命中后从该标题开始，删除至下一个同级或更高等级标题前。
- 禁止新增其他业务事实，禁止引入 PRD 中不存在的信息。
- 除被排除章节外，其余内容必须逐条原文保留，不允许摘要化、归纳改写、合并压缩。
- 原文中的标题层级、表格、列表、编号、链接、图片引用需原样保留（仅允许最小格式修复）。

2. 完整性校验（采集阶段）
- 未拿到完整正文时，禁止落库；应明确报错“源文档获取不完整”。
- 若输入为语雀链接且仅返回登录页/摘要页，判定为“源文档获取不完整”。

3. 样式清洗（必做）
- 仅清洗“展示样式噪音”，不改变业务文本语义与文档结构。
- 需要清洗的典型内容：
  - `<font ...>...</font>`（包含 `style/color/background-color` 等属性）
  - `<span ...>...</span>`（仅承载样式属性）
  - 其余 HTML 标签上的纯展示属性：`style`、`class`、`color`、`bgcolor`
- 清洗后要求：
  - 保留标签内原始文本、换行、列表、表格、链接、图片引用。
  - 不得删除正文信息，不得新增原文不存在的业务内容。
  - 不做摘要化改写，不做术语替换。

4. 落库（覆盖更新）
- 默认输出路径：`ai-workflow/sdd/changes/<change-id>/prd/<源文件名>.md`。
- 目标目录不存在时，先创建 `ai-workflow/sdd/changes/<change-id>/prd/`。
- 不做本地差异判断，直接覆盖目标文件。
- 目标文件已存在时，直接覆盖更新，并同步更新“落库时间”。
- 覆盖后必须校验写盘成功（如文件修改时间更新），否则判定为失败。

5. 自检
- 输出中不得出现以下章节（含同义标题变体）：`变更记录`、`文档版本记录`、`竞品参考`。
- 输出中不得出现语雀样式噪音：`<font style=`、`<span style=`、`style="color:`、`background-color:`。
- 除被排除章节外，每条内容都能在原 PRD 中逐条追溯到依据。
- 除被排除章节外，不得只保留摘要句；需保留完整原文结构。

## 执行门禁（Gate）

- Gate 1：未执行第 4 步“落库（覆盖更新）”，禁止宣布完成。
- Gate 2：出现“本地一致因此跳过覆盖”的行为，直接判定为流程违规。
- Gate 3：未完成写盘成功校验（如文件修改时间未更新），禁止进入最终输出。
- Gate 4：落库路径不在 `ai-workflow/sdd/changes/<change-id>/prd/` 下，判定为流程违规。
- Gate 5：未执行第 3 步“样式清洗”或清洗后仍残留样式噪音，禁止进入最终输出。

## 规则

- 信息缺失时明确标注“待确认/待补充”，不主观推测。
- 输出文档始终写入 `ai-workflow/sdd/changes/<change-id>/prd/`。
- 禁止在导入执行中进行摘要化处理；只允许“按排除章节裁剪”，不允许“按内容压缩”。
- 样式清洗仅移除展示层信息，不得影响正文事实、标题层级、表格结构、链接地址与图片地址。
