# Unit 测试代码风格

以下风格参考目标代码库已有的 `ServiceImplTest` 写法，例如：

- `server/<module>/src/test/java/<base_package>/service/impl/<Resource>ServiceImplTest.java`
- `server/<module>/src/test/java/<base_package>/domain/<DomainService>Test.java`

## 基础结构

- 默认使用 `@ExtendWith(MockitoExtension.class)`。
- 优先使用 `@InjectMocks + @Mock` 注入被测对象和依赖。
- 需要部分覆写被测类内部方法时，使用 `@Spy + doReturn`。
- 有上下文变量时，用 `@BeforeEach` 做初始化，`@AfterEach` 做清理。

## 测试方法写法

- 测试方法名直接表达“场景 + 预期”，例如：
  - `refreshTaskPoolShouldThrowWhenTaskPoolFull`
  - `saveOrUpdateInitDetailShouldSkipPatchWhenOnlyAuditFieldsPresent`
- 复杂场景可补简短注释说明“场景 / 期望”；简单场景靠方法名表达即可。
- 一个 `@Test` 只验证一个主场景，避免把多条互斥断言塞进同一个方法。

## Arrange / Act / Assert

- 先 mock 依赖输入和返回。
- 再调用被测方法。
- 最后做返回值、异常、状态和副作用断言。

常见断言方式：

- 返回值：`assertEquals`、`assertTrue`、`assertNull`
- 异常：`assertThrows`
- 交互：`verify`、`times`、`never`
- 参数捕获：`ArgumentCaptor`

## 依赖 mock 约束

- DB / DAO / HTTP / MQ / Redis / 三方 SDK 默认 mock，不启动真实环境。
- 只有当前测试场景用到的依赖才配置行为；公共默认行为可放到 `@BeforeEach` 里用 `lenient()`。
- 依赖失败场景要明确失败形态：抛异常、返回空、返回异常码、返回非法状态。

## 并发与幂等

- 并发场景优先用共享 mock、共享锁桩、共享仓储桩模拟，不起真实多实例。
- 幂等场景除了返回值，还要断言副作用次数，例如 `times(1)`。
- 有锁时，至少覆盖成功获取锁和竞争失败或不适用说明。

## 生成边界

- 只补 Java 测试代码，不生成规格文件、JSON suite 或额外测试资源。
- 若仓库已有同名测试文件，优先增量补方法，不整文件覆写。
