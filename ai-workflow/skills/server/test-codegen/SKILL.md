---
name: test-codegen
description: 只生成后端 `unit` / `api-mock` Java 测试代码，不生成规格文件、JSON suite 或 case 表。用于用户只想补 `Service`、`Domain`、`Manager`、`Util`、`DAO`、`Endpoint`、`Controller` 的测试代码时显式调用。
version: 1.2.0
owners:
  - sunwencong
---

# 生成后端测试代码

## 作用

- 只生成或更新后端 `unit` / `api-mock` Java 测试代码。
- 按仓库现有测试风格覆盖 `unit` / `api-mock` 场景。
- 不生成规格文件、JSON suite 或 spec/case 表。

## 何时使用

- 用户明确只要 Java 测试代码，不要 spec / JSON suite。
- 需要补 `Service` / `Domain` / `Manager` / `Util` / `DAO` 的单元测试代码。
- 需要补 `Endpoint` / `Controller` 的 `MockMvc` 接口测试代码。
- 需要增量修改现有 `*Test.java` 或 `*EndpointIT.java`。

以下场景不要用本 skill：

- 需要完整 `spec -> JSON suite -> Java test` 资产链路或资产完整性门禁。
规格和 JSON 资产链路当前不由本 skill 承接。

## 最小输入

至少明确以下 4 项：

- 目标模块。
- 被测类或接口。
- 被测方法或接口动作。
- 测试模式：`unit` / `api-mock`（可选）。

推荐再补：

- 覆盖档位：`full` / `minimal`（默认 `full`）。
- 变更背景与风险点。
- 依赖点列表。
- 状态流转、并发、幂等、补偿等特殊约束。
- 当前已有测试文件路径，若是增量修改。

## 模式判定

- `Endpoint` / `Controller` / HTTP API / 路由 / 响应校验：`api-mock`
- `Service` / `Domain` / `Manager` / `Util` / `DAO` / 纯逻辑：`unit`
- 持久化契约优先覆盖 DAO/Manager 查询、空结果、分页排序、批量写入和异常分支。
- 业务契约优先覆盖 Service/Facade 成功、失败、边界、状态、幂等、补偿和外部依赖分支。
- 入口契约优先覆盖 request/response 字段、参数校验、鉴权、错误映射和响应封装。
- Worker/MQ/Event 契约优先覆盖触发解析、锁、幂等、重试、ack/nack、补偿和 service 调用。
- 一次执行只选择一个主模式。
- 未指定覆盖档位时默认 `full`。
- 只有用户明确要求“最小测试 / 最小覆盖”时才允许 `minimal`。
- 真实服务、真实数据库、真实鉴权、live 回归：不由本 skill 承接。

## 读取顺序

1. 先读当前目标类和被测方法代码。
2. 读取 [references/rules/INDEX.md](references/rules/INDEX.md)，按“规则索引”命中测试代码生成规则。
3. 判定模式后按需读取：
   - `unit`： [references/unit-scene-matrix.md](references/unit-scene-matrix.md) 和 [references/unit-test-style.md](references/unit-test-style.md)
   - `api-mock`： [references/api-mock-scene-matrix.md](references/api-mock-scene-matrix.md) 和 [references/api-mock-test-style.md](references/api-mock-test-style.md)
4. 若目录落点、路由或模块边界不清楚，再补读根目录 `AGENTS.md`、`server/AGENTS.md` 与相关设计/API 契约文档。

## 生成范围

- `unit`：只生成 `server/<module>/src/test/java/**/<ClassName>Test.java`
- `api-mock`：只生成 `server/<module>/src/test/java/**/<Resource>EndpointIT.java` 或现有对应 `*ControllerIT.java`
- 若测试文件已存在，按现有类结构增量补方法，不整文件重写。
- 不生成以下内容：
  - `src/test/resources/testcases/spec/**`
  - `src/test/resources/testcases/api/*.json`
  - `src/test/resources/testcases/unit/*.json`
  - `sourceSpecId`、`coveredBranchIds`、`methodSuite` 这类规格驱动资产

## 覆盖逻辑

- `full`：显式覆盖 `positive / negative / boundary / concurrency` 四大类；不适用时要在交付说明里写原因。
- `minimal`：每个目标至少 1 个成功 case + 1 个失败或边界 case。
- `minimal` 命中并发、状态机、锁、补偿、导入导出、open 等高风险主题时，仍需补专项测试。
- 生成代码前，先枚举实现分支：`entry_guard`、`success_path`、`optional_noop`、`local_consistency_guard`、`dependency_call`、`post_side_effect`、`concurrency_control`。

## 代码约束

- `unit`：默认 `JUnit5 + MockitoExtension`，DB / HTTP / MQ / 缓存 / 三方依赖默认 mock。
- `api-mock`：默认 `MockMvc + Mockito + JUnit5`，至少断言状态码、业务码、关键字段。
- 简单场景优先 `@InjectMocks + @Mock`；需要部分覆写被测类内部行为时，允许 `@Spy + doReturn`。
- 异常路径用 `assertThrows`；副作用与依赖交互用 `verify`、`times`、`never`、`ArgumentCaptor`。
- 存在 MDC、ThreadLocal、上下文变量时，补 `@BeforeEach / @AfterEach` 做装配与清理。
- `api-mock` 优先复用仓库现有 `MockMvcBuilders.standaloneSetup(...)`、校验器、`ControllerAdvice`、`jsonPath` 断言风格。
- 不允许为了通过测试篡改业务语义；若发现代码与预期冲突，应先指出代码问题。

## 完成标准

- 至少生成或更新 1 个真实测试代码文件。
- `full` 缺少四大类且未说明不适用原因，禁止结束。
- `minimal` 低于最低门槛，或高风险主题缺专项测试，禁止结束。
- mock、断言和副作用校验必须与本轮场景对应，不能只断返回值或只断状态码。
- 若未执行测试，必须输出可执行命令和未执行原因。

## 输出模板

```md
## 测试代码结果
- 模块：
- 模式：unit / api-mock
- 被测类或接口：
- 被测方法或动作：
- 覆盖档位：full / minimal
- 测试文件：
- 新增/更新的测试方法：
- 已覆盖场景：
- 不适用场景：
- 执行命令：
- 执行状态：PASS / FAIL / NOT_RUN
- 风险与待补充：
```
