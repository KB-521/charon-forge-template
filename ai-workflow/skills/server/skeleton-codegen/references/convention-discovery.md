# Convention Discovery

有同模块或同项目相似实现时，优先抽取现有约定；只复用结构，不复制业务事实、权限值、路由或敏感配置。

## 抽取步骤

1. 用 `rg` 查同模块相似实体的链路：PO、POQuery、DAO/Repository、Mapper XML、sqlmapplus/OpenDAO、Manager/Repository wrapper。
2. 记录包名、路径、基类、注解、Mapper namespace、XML id、分页排序、Manager wrapper 风格。
3. 区分强约定和偶然写法：优先同模块、同业务域、近期仍可编译的实现。
4. 找不到参考时切换到 `default-generation.md`。

## 约定表

| 项 | 结论 | 证据文件 | 缺口 |
| --- | --- | --- | --- |
| root package / 模块 |  |  |  |
| PO / POQuery |  |  |  |
| DAO / Repository |  |  |  |
| Mapper XML |  |  |  |
| sqlmapplus / OpenDAO |  |  |  |
| Manager / Repository wrapper |  |  |  |
| 校验命令 |  |  |  |
