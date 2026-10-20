# Next.js 真实项目模板化

- Change ID：20261020-nextjs-template。
- 当前阶段：按“保留通用能力”纠正过度裁剪，恢复请求封装、基础组件/hooks/工具/轻量国际化；回归及隔离生成、安装、lint、类型检查、生产构建通过。
- 用户范围：先梳理并说明建议删除和保留的部分，用户随后授权“好 你来处理吧”，按推荐方案完成模板化。
- [设计索引](design/INDEX.md)。
- [模板裁剪建议](design/nextjs-template-analysis.md)：DES-FE-20261020-001。
- [实施计划](implementation-plan.md)。
- [实施与验证记录](validation.md)：含原工程备份位置、最终范围、实际验证结果和交付边界。
- 没有启动服务器、暂存/提交 Git 或发布；源码负载内没有安装、构建产物。
- ESLint 已按用户最新指定迁移到 `@charonix/eslint-config@1.2.0` 与 eslint.config.js；本次锁文件安装及 lint 验证见验证记录末节。
- 已恢复本地/测试/线上环境分支和环境命令，代理、CDN、图片白名单及日志策略独立；配置矩阵、测试/线上实际构建和视频导入检查通过。
