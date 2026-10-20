# 5. 设计并实现 starter 模块

## 何时读取

开始创建或修改 `metac-<channel>pay-spring-boot-starter` 时读取本文件。

## 执行动作

- 目录使用 `my-starters/metac-<channel>pay-spring-boot-starter`。
- 需要 starter 结构细节时读 [rules/INDEX.md](./rules/INDEX.md)，再读取 starter 规则切片。
- 需要创建最小文件骨架、自动配置样例和 `measure` 接入落点时读 [starter-implementation-skeleton.md](./starter-implementation-skeleton.md)。
- 按需建立 `autoconfigure`、`endpoint`、`client`、`service`、`dto`、`enums`、`constants`、`handle`、`util`。
- 通过 `META-INF/spring.factories` 注册自动配置。
- provider service/client 默认用 `@ConditionalOnMissingBean`；依赖业务接口才能安全暴露 endpoint 时用 `@ConditionalOnBean`。

## 产出

- starter 模块。
- 自动配置。
- endpoint/client/service。
- DTO/enum。
- 事件发布器。
- 必要单测。

## 门禁

starter 不直接写业务表，不记录敏感原文，不自行发放权益，不自行改变 `measure` 订单状态。
