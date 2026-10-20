# Default Generation

无同模块参考实现时，按本文件独立生成 Java 持久化骨架。默认规范必须能被目标项目依赖编译；依赖不存在时使用 Generic Profile 生成无基类骨架；仍无法推导 root package 或模块时才输出 BLOCKER。

## Profile 选择

| Profile | 命中条件 | 生成策略 |
| --- | --- | --- |
| Metac Profile | 目标项目存在 `BasePO`、`PagePOQuery`、`CrudDAO`、`BaseCrudManager` 等依赖 | 使用 Metac 基类和模板，基础字段可由 BasePO 承接 |
| Generic Profile | 新项目没有 Metac 基类，或无法确认这些依赖存在 | 生成普通 PO、Query、DAO、Manager/Repository wrapper，显式声明全部字段和基础方法 |

选择 profile 前先用源码、依赖或构建文件确认；不能仅凭项目名猜测。

## 默认项目结构

| 项 | 默认规则 |
| --- | --- |
| Java 栈 | Spring Boot + Maven + MyBatis |
| domain module | `<project>-domain` |
| dal module | `<project>-dal` |
| biz module | `<project>-biz` |
| web module | `<project>-web` |
| root package | 从目标模块现有 Java 包、Maven groupId 或 AGENTS 说明推导；仍缺失时输出 BLOCKER |

## 默认推导

| 项 | 默认规则 |
| --- | --- |
| root package | 从目标模块现有 Java 包、Maven groupId 或 AGENTS 说明推导。 |
| domain module | `<project>-domain` 或已有 `domain/po` 所在模块。 |
| dal module | `<project>-dal` 或已有 `dal/dao`、`sqlmap` 所在模块。 |
| 主键类型 | 默认 `Long`；若 SQL 主键不是 BIGINT，按 SQL 类型映射。 |
| PO 基类 | Metac Profile 使用 `BasePO<Long>`；Generic Profile 不继承基类。 |
| Query 基类 | Metac Profile 使用 `PagePOQuery`；Generic Profile 显式声明 `pageNum`、`pageSize`。 |
| DAO 基类 | Metac Profile 使用 `CrudDAO<PO, Long>`；Generic Profile 显式声明基础方法。 |
| Manager 基类 | Metac Profile 使用 `BaseCrudManager<DAO, PO, Long>`；Generic Profile 使用普通 Spring `@Component` 薄封装。 |
| XML 基础方法 | 必须生成 `BaseResultMap`、`Base_Column_List`、`Query_Table`、`selectByPrimaryKey`、`selectByPrimaryKeys`、`selectByCondition`、`insertSelective`、`updateByPrimaryKeySelective`。 |

## 字段映射

| SQL 类型 | Java 类型 | jdbcType | 默认处理 |
| --- | --- | --- | --- |
| BIGINT | Long | BIGINT | 主键默认 Long。 |
| INT / INTEGER | Integer | INTEGER | - |
| TINYINT / SMALLINT | Integer | TINYINT / SMALLINT | - |
| VARCHAR / CHAR | String | VARCHAR / CHAR | 加 `@Size(max = n)`。 |
| TEXT / LONGTEXT / JSON | String | LONGVARCHAR | 不默认加长度校验。 |
| DECIMAL | BigDecimal | DECIMAL | - |
| DATETIME / TIMESTAMP | LocalDateTime | TIMESTAMP | Query 可生成 Start/End。 |
| DATE | LocalDate | DATE | Query 可生成 Start/End。 |
| TIME | LocalTime | TIME | - |

## 字段生成规则

- PO 按 SQL 字段顺序生成；字段注释来自 SQL COMMENT 或数据模型说明。
- Metac Profile 中，`ID` 和基础字段由 BasePO 承接时不重复声明；必须先确认 BasePO 字段。
- Generic Profile 中，PO 显式声明全部表字段，包括 `ID`、`STATUS`、`REMARK`、`CREATE_BY`、`CREATE_TIME`、`UPDATE_BY`、`UPDATE_TIME`、`ORG_CODE`、`TENANT_ID`。
- 无法确认 BasePO 是否承接基础字段时，切换 Generic Profile 或输出 BLOCKER，不生成重复字段。
- 非空且无默认值字段可加 `@NotNull`；字符串长度字段加 `@Size(max = n)`。
- Query 默认包含主键、索引字段、唯一键字段、状态/类型字段、外键字段和明确查询字段。
- Query 对状态/类型/外键字段可生成 `xxxList`；时间字段可生成 `xxxStart`、`xxxEnd`。
- `@SortField` 只包含主键、创建/更新时间和明确允许排序的索引字段。

## 默认交付说明

使用默认规范时，交付必须写明：
- 无同模块参考实现，已按默认规范生成。
- 使用 Metac Profile 还是 Generic Profile，以及选择依据。
- root package、domain module、dal module、主键类型和基础类。
- SQL 字段到 PO/Query/XML 的映射清单。
- XML 基础方法是否完整生成。
