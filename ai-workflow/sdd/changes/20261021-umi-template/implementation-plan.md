# Umi Template Implementation Plan

**Goal:** 迁移 Umi 现有工程为可独立使用的标准初始化模板，提取通用组件并清理内部绑定。

**Architecture:** Umi Max 原生应用，浏览器演示/API 双模式、受控公开运行时配置与可注入上传 transport；模板不加入根 workspace。

**Tech Stack:** Umi Max 4、React 18、Ant Design 5 / Pro Components 2、TypeScript、ahooks、Tailwind 3、pnpm 10。

按仓库约定写入 SDD；串行执行，用户已授权迁移，不重复确认、不开 worker、不提交发布。

1. 读取 Memory/Agent/索引；来源快照与能力矩阵、公开依赖解析；保存需求和设计。
2. 创建 templates/web/umi 协议与原生配置，复制审核过的通用源码，安全重写服务/运行时/路由/权限、上传与示例页面。
3. 在仓库外生成开发工程，公开 registry 安装并锁定，执行 max setup、tsc、有效测试与 build；修复实际兼容问题并只同步源码和锁文件。
4. 验证静态预览和开发服务；浏览器检查筛选/分页/排序/选择/导出、上传/Excel/权限/个人资料、运行时 allowlist，检查 console/network。
5. 刷新临时 Git index，四模板校验与 Umi 原生 verify、防污染；检查 source/index 摘要、原有用户修改与敏感字段。
6. 完善模板 README/CHANGELOG、能力矩阵和验证结果；更新导航与 SDD 状态，不修改用户正在编写的初始化 skill。

六步已串行完成；执行结果与边界见 [验证记录](validation.md)。
