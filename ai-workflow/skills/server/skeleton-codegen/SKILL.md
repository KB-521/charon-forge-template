---
name: skeleton-codegen
description: 根据已冻结的数据模型和 SQL 文件，为 Java 后端生成或补齐持久化代码骨架，包括 generator、PO/POQuery、DAO/Repository、Mapper XML、sqlmapplus/OpenDAO 与薄 Manager/Repository wrapper；不生成业务 Service、Facade、DTO/VO 或对外 Endpoint/Controller。
version: 2.3.1
owners:
  - sunwencong
---

# 后端持久化骨架代码生成

## 目标

把冻结的数据模型和 SQL 文件转成可编译、可继续实现的 Java 持久化骨架。优先复用同模块相似实现；没有参考实现时，按默认规范独立生成完整骨架。

本 skill 只负责 Java 持久化骨架。SQL 文件转 `server/persistence-impl`，业务实现转 `server/req-impl`，入口实现转 `server/entry-impl`。

## 命中场景

- 新增表或字段后，需要生成 generator、PO/POQuery、DAO/Repository、Mapper XML、Manager。
- 修改字段类型、命名、默认值、状态/类型码值后，需要同步 Java 持久化映射。
- 新增查询条件、分页排序、批量读写、sqlmapplus、OpenDAO/OpenMapper 骨架。
- 业务层实现前发现缺少 DAO/Manager 方法签名或 Mapper XML statement。

## 不适用场景

- DDL、DML、schema delta、history compat、rollback/fixforward SQL 文件：转 `server/persistence-impl`。
- Service/Facade、事务、状态机、幂等、MQ、外部能力：转 `server/req-impl`。
- Endpoint/Controller、DTO/VO、路由、响应封装、YApi：转 `server/entry-impl`。
- 逻辑模型、字段语义、索引策略或兼容口径未冻结：转 `server/data-model-design`。
- Java unit / api-mock 测试代码：转 `server/test-codegen`。

## 输入

- 冻结的数据模型：表、字段、索引、唯一约束、字典/枚举和兼容结论。
- `server/persistence-impl` 产出的 SQL 文件清单、manifest、执行顺序和 DDL/DML 引用。
- 目标模块、实体名、root package、domain/dal 模块边界；无法确认时从项目目录推导。
- 查询/写入/分页/排序/open 链路需求；只用于生成持久化方法骨架。
- 新项目或无同模块参考实现时，读取 `references/default-generation.md`，选择 Metac Profile 或 Generic Profile。

## 读取顺序

1. 读取目标项目 `AGENTS.md` 或等价说明。
2. 读取 `references/rules/INDEX.md`，按规则索引命中规则。
3. 有同模块参考实现时读取 `references/convention-discovery.md` 并用 `rg` 查 PO/POQuery/DAO/Mapper/Manager。
4. 无参考实现或需要默认生成时读取 `references/default-generation.md`。
5. 字段新增/变更时读取 `references/field-change-matrix.md`。
6. 按产物读取模板：`templates/java-persistence.md`、`templates/mapper-xml.md`、`templates/plus-open.md`。

## 执行顺序

1. **冻结输入**：确认数据模型、SQL 文件、主键、字段、索引、兼容结论和目标模块。
2. **确定规范**：优先同模块参考；无参考则按默认规范生成，并标注默认规范来源。
3. **生成骨架**：生成或修改 generator、PO、POQuery、DAO/Repository、Mapper XML、Manager；Plus/Open 仅在需求明确时生成。
4. **自检交付**：检查字段映射、XML 基础方法、DAO/XML 方法一致性、分页排序和 open 边界，输出 Persistence To Business 方法契约。

## 核心门禁

- 未冻结数据模型和 SQL 文件，禁止生成 Java 骨架。
- 无法推导 root package、domain/dal 模块、主键类型或基础类依赖时，输出 BLOCKER。
- Mapper XML 必须根据表结构完整生成基础方法，不能只生成空 mapper 或 `resultMap`。
- 本 skill 禁止新增业务 Service、Facade、DTO/VO、Endpoint 或 Controller。
- generator 不默认运行；执行前必须确认配置、输出范围和覆盖风险。

## 交付

- 输入引用、默认/参考规范来源、生成/修改文件清单。
- PO/Query/XML 字段映射清单和 XML 基础方法清单。
- DAO/Manager 方法契约：方法名、入参、返回、SQL/XML id、索引、空结果语义。
- 验证命令、结果或未执行原因；剩余风险和后续路由。
