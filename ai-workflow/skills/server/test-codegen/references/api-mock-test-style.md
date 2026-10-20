# API-Mock 测试代码风格

以下风格参考目标代码库已有的 `EndpointIT` 写法，例如：

- `server/<module>/src/test/java/<base_package>/endpoint/<Resource>EndpointIT.java`

## 基础结构

- 默认使用 `@ExtendWith(MockitoExtension.class)`。
- 接口对象通常使用 `@Spy + @InjectMocks`，其依赖使用 `@Mock`。
- 需要宽松 mock 时，可使用 `@MockitoSettings(strictness = Strictness.LENIENT)`。
- 默认用 `MockMvcBuilders.standaloneSetup(...)` 组装 `MockMvc`，并补齐：
  - `ControllerAdvice`
  - `Validator`
  - `MappingJackson2HttpMessageConverter`
  - `ObjectMapper` 的时间模块和序列化配置

## 上下文与环境

- 若接口依赖 `MDC`、`SpringContextUtil`、配置类或静态上下文，要在 `@BeforeEach` 注入并在 `@AfterEach` 清理。
- 若 endpoint 内部字段不是标准注入路径，可使用 `ReflectionTestUtils.setField(...)`。

## 请求与断言

- 使用 `MockMvc` 发起请求，常见为 `post/get/delete`。
- 至少断言：
  - HTTP 状态码
  - 业务码或 message
  - 关键响应字段
- 优先使用 `jsonPath(...)` 断言结构和字段值。
- 参数校验失败、业务失败、越权、空数据等场景，要显式断言响应内容，不只断 `status().isOk()`。

## 依赖 mock 约束

- Service / DAO / SDK / 配置类默认 mock，不启动真实 Spring 容器和真实数据库。
- 每个依赖调用点按场景分别 mock，不把多种失败形态合并成一条笼统 stub。
- 涉及入参透传、分页、过滤条件等，优先用 `ArgumentCaptor` 校验调用参数。

## 测试方法写法

- 测试方法名直接表达“接口动作 + 场景 + 预期”，例如：
  - `pageShouldReturnPartnerMemberItems`
  - `pageShouldReturnValidationErrorWhenPageSizeMissing`
- 一个 `@Test` 只验证一个主场景。
- 若场景复杂，可以补少量注释，但不要用冗长说明代替清晰命名。

## 生成边界

- 只补 Java 接口测试代码，不生成规格文件、JSON suite 或额外测试资源。
- 若仓库已有同名 `*EndpointIT.java` / `*ControllerIT.java`，优先增量补方法，不整文件覆写。
