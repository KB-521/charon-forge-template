# Skeleton Rules

## 适用场景

生成或修改 generator、PO、POQuery、DAO/Repository、Mapper XML、sqlmapplus/OpenDAO/OpenMapper、薄 Manager/Repository wrapper 等 Java 持久化骨架时读取。

## 命中条件

| 维度 | 命中信号 |
| --- | --- |
| 产物 | generator、PO、POQuery、DAO、Repository、Mapper XML、Manager、OpenDAO/OpenMapper |
| 动作 | 新增表骨架、新增字段映射、修改字段映射、新增查询、分页排序、批量读写、open 查询 |
| 风险 | Java 映射与 SQL 不一致、DAO/XML 方法不一致、分页排序错误、租户/open 越权 |
| 可跳过 | 不涉及 Java 持久化骨架 |

## 门禁

- 必须确认 `change-id`、目标模块、目标表/实体、目标持久化能力。
- 必须引用冻结的数据模型和 SQL 文件；没有冻结结论时只输出缺口。
- 新增 DAO/Manager 方法时，必须有调用方需求、查询/写入语义、入参、返回和空结果语义。
- 不在生成代码、XML、注释或交付说明中复写 token、账号、密码、签名、连接串和密钥。
- 表结构、字段、索引、基础类、DAO/Manager 基类和 XML 方法必须来自同模块源码、冻结 SQL 或本 skill 默认生成规则；缺少来源时输出 BLOCKER。
- 只生成 Java 持久化骨架，不顺手实现 SQL、Service、Endpoint、测试或无关重构。
- 涉及旧字段、旧查询、租户/open 边界或共享表时必须说明兼容、回滚和剩余风险。

## 范围

| 场景 | 必改 | 禁止 |
| --- | --- | --- |
| 新增表 | generator、PO/POQuery、DAO、Mapper XML、Manager；Plus/Open 按需。 | 生成 SQL、Service、Endpoint、DTO/VO。 |
| 新增字段 | PO/POQuery、Mapper resultMap/Base_Column_List、insert/update/selective、查询/排序条件。 | 只改 Java 不确认 SQL 文件。 |
| 修改字段 | Java 类型、字段命名、注释、Mapper 映射、DAO/Manager 签名、兼容风险。 | 静默改变旧业务语义。 |
| 新增查询 | POQuery、Mapper where/order、DAO/Manager 方法、分页/排序。 | 写业务规则或入口协议。 |
| Plus/Open | PlusDAO/PlusMapper/OpenDAO/OpenMapper 和调用边界。 | 绕过租户隔离或新增临时白名单。 |

## 约定选择

- 优先使用 `convention-discovery.md` 抽取同模块相似实现。
- 找不到同模块参考时，按 `default-generation.md` 独立生成。
- 无法推导模块边界、root package、主键类型或基础类依赖时，输出 BLOCKER，不猜测。
- 不从其它项目复制业务事实、敏感配置、权限值、路由或类名。

## 分层边界

- 本 skill 只落 Java 持久化结构、方法签名、字段映射、Mapper statement 和薄 Manager 调用。
- DDL/DML/schema delta/history compat/rollback SQL 转 `server/persistence-impl`。
- Service/Facade/事务/幂等/MQ/外部能力转 `server/req-impl`。
- Endpoint/Controller/DTO/VO/响应封装转 `server/entry-impl`。
- Java unit/api-mock 测试代码转 `server/test-codegen`。

## 生成规则

- generator 不默认执行；执行前必须确认配置、输出范围、覆盖策略和回滚方式。
- PO、POQuery、resultMap、Base_Column_List、insert/update/selective 和 generator 配置必须与 SQL 文件一致。
- 无参考实现时，先选择 profile：Metac Profile 使用 `BasePO<Long>`、`PagePOQuery`、`CrudDAO<PO, Long>`、`BaseCrudManager<DAO, PO, Long>`；Generic Profile 使用无基类 PO/Query、显式 DAO 方法和普通 Manager/Repository wrapper。
- Mapper XML 必须完整生成基础方法：`BaseResultMap`、`Base_Column_List`、`Query_Table`、`selectByPrimaryKey`、`selectByPrimaryKeys`、`selectByCondition`、`insertSelective`、`updateByPrimaryKeySelective`。
- 只生成空 XML 或只生成 `resultMap` 禁止交付。

## DAO/Mapper/Manager

- DAO/Repository 只暴露明确读写能力，不写业务状态机。
- Mapper XML 必须与 DAO 方法、namespace、statement id、参数和返回一致。
- Manager/Repository wrapper 只能做薄封装或项目约定的数据管理能力。
- 查询结果为空时必须有明确语义：null、empty list、empty page 或 exception。

## Plus/Open

- PlusDAO/PlusMapper 只用于基础 Mapper 无法承接的自定义查询/更新。
- 跨租户、全局扫描、调度扫描、open 查询必须走既有 OpenDAO/OpenMapper/OpenService 约定。
- 禁止为绕过租户隔离新增临时 SQL 或白名单。
- open 能力必须说明调用方、数据范围、分页/限流和字段边界。

## 交付要求

- 交付必须包含输入冻结结论、规范来源、生成文件清单、未生成原因、方法契约、验证结果或未验证原因。
- 使用默认规范时，必须列出 profile、root package、module、基类/无基类策略、主键类型、XML 基础方法和字段映射清单。
- 有 BLOCKER 时必须写清楚缺少哪份契约、哪条源码证据或哪项设计结论。
- 交付必须列出命中规则、变更文件、验证结果和剩余风险。
