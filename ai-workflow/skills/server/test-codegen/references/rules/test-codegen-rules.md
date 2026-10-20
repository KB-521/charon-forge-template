# Test Codegen Rules

## 适用场景

只生成或更新后端 `unit` / `api-mock` Java 测试代码时读取。

## 命中条件

| 维度 | 命中信号 |
| --- | --- |
| 产物 | `*Test.java`、`*EndpointIT.java`、`*ControllerIT.java` |
| 动作 | 新增测试、补分支、修改断言、补 mock 或副作用校验 |
| 风险 | 覆盖不足、断言过浅、上下文污染、为了测试改业务语义 |
| 可跳过 | 不生成或修改测试代码 |

## 决策表

| 场景 | 测试模式 | 默认技术 |
| --- | --- | --- |
| Service/Domain/Manager/DAO/Util | unit | JUnit5 + Mockito |
| Endpoint/Controller/HTTP API | api-mock | MockMvc + Mockito + JUnit5 |

## 门禁

- `full` 覆盖 positive、negative、boundary、concurrency；`minimal` 至少 1 成功 + 1 失败或边界。
- 生成前先枚举 entry_guard、success_path、optional_noop、dependency_call、post_side_effect、concurrency_control。
- 至少断言业务结果和关键副作用；异常路径用 `assertThrows`，依赖交互用 `verify`/`ArgumentCaptor`。
- MDC、ThreadLocal、租户/用户上下文必须在 `@BeforeEach` / `@AfterEach` 装配和清理。
- 不允许为了通过测试篡改业务语义；发现代码与预期冲突时先指出问题。
- 测试资产、日志和样例数据不得包含 token、账号、密码、签名、连接串和密钥。
- mock、fixture、DTO、错误码和依赖行为必须来自源码、契约或已确认输入；缺少来源时输出缺口。
- 只生成当前任务需要的测试代码，不顺手重构业务代码或扩大测试范围。

## 交付要求

| 项 | 必填内容 |
| --- | --- |
| 模式 | unit / api-mock |
| 覆盖档位 | full / minimal |
| 测试文件 | 新增或修改文件 |
| 覆盖场景 | positive、negative、boundary、concurrency 或不适用原因 |
| 执行结果 | PASS / FAIL / NOT_RUN 和命令 |
| 交付证据 | 命中规则、测试文件、未验证原因、剩余风险 |

## 高风险反例

- 只断状态码，不断业务字段。
- 只测成功路径。
- mock 行为和真实依赖语义不一致。
