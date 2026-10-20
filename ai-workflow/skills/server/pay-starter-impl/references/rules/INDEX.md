# 支付渠道 Starter 规则索引

本目录存放 `pay-starter-impl` 的稳定规则切片。执行时先读本索引，再只读取命中的本地规则文件。

## 读取规则

- 只判断职责边界时，优先读 `starter-domain-boundaries.md`。
- 只判断 measure 接入、状态机、数据或补偿时，优先读 `measure-integration-patterns.md`。
- 跨 starter 和 measure 的端到端方案或审查，可以两个规则文件都读。
- 规则文件中的源码路径只做检索入口；最终以当前 `${MY_ARCHETYPE_ROOT}`、`${MEASURE_ROOT}` 源码为准。

## 规则索引

| 任务事实 | 读取规则 | 可跳过条件 |
| --- | --- | --- |
| my-archetype 支付渠道 starter、pay SDK 契约、自动配置、事件发布、业务窄接口、安全边界 | `starter-domain-boundaries.md` | 不涉及 starter 或 pay SDK 边界 |
| measure 运行模块、handler、adapter、业务状态机、数据枚举、幂等补偿和测试 | `measure-integration-patterns.md` | 不涉及 measure 侧支付业务承接 |
