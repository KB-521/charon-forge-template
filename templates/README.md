# 模板入口

框架通过 `分类/模板/template.json` 自动发现模板，不依赖写死的技术栈清单。

| 分类 | 模板 ID | 内容 | 入口 |
| --- | --- | --- | --- |
| web | nextjs | Next.js App Router、TypeScript、Tailwind CSS、Ant Design；通用起始工程 | [使用与维护说明](web/nextjs/README.md) |

```text
templates/<category>/<id>/
├── template.json
├── README.md
├── CHANGELOG.md
└── files/                  # 原生项目的基础源码
```

从 [模板贡献说明](../docs/template-contributing.md) 开始。测试夹具位于 `tests/`，不会作为可选模板或 CLI 包负载分发。
