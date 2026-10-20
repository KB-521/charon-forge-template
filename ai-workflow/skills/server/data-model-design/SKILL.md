---
name: data-model-design
description: 从 PRD、任务或后端技术方案冻结逻辑数据模型、物理表结构、SQL 契约、兼容口径与字典/枚举方案。适用于需要确认后端数据模型、表结构、索引、基础字段和存量兼容口径的场景；真实 SQL 文件落地由 server/persistence-impl 承接。
version: 1.3.4
owners:
  - sunwencong
---

# 数据模型设计

## 作用

- 从 PRD、任务或后端技术方案中抽取业务实体、关系、状态、枚举和约束。
- 冻结逻辑数据模型、物理表结构、索引、基础字段、字典/枚举、兼容口径和 SQL 契约。
- 作为后端表结构与 DDL 规则的唯一 skill 来源；`server/backend-design` 只负责总方案编排和引用。

## 输入

- PRD、任务、评审结论或用户补充约束。
- `server/backend-design` 产出的主设计、API 清单或状态机结论。
- 现有源码、SQL、枚举、字典和已落地表结构。
- 新项目或无历史参考时，按本 skill 的无参考默认规范冻结 SQL 目录、基础字段和 DML 写入口径。

## 产物

- 逻辑数据模型：`<project>-logical-data-model.md`。
- 物理表结构契约：落到 `design/<design-package>/sql/` 与 `server/docker-config/sql/<design-package>/` 的 schema SQL 文件，文件名、内容和 manifest 保持一致。
- SQL 契约：SQL 类型、双写目录、文件名前缀、`source-id`、manifest 顺序、幂等、回滚/补救和兼容策略；真实 SQL 文件由 `server/persistence-impl` 生成。
- 字典/枚举：字典初始化 SQL、枚举变更说明或对应枚举文件建议。
- 数据到持久层交接：表/实体、字段/索引变化、查询条件、排序字段、唯一/防重键、批量操作、租户/open 边界和预期持久化方法。

## 工作流

1. **确认范围**
- 明确 `change-id`、项目域、设计包、输入文档和变更类型。
- 区分新增表、共享表增量、字段调整、字典变更和历史兼容。
- 外部系统主数据默认不重复建模；确需镜像时说明缓存、离线或审计必要性。
- 读取 `references/rules/INDEX.md`，按“规则索引”命中本 skill 的数据模型与 SQL 规则。

2. **冻结逻辑模型**
- 读取 `references/logical-data-model-template.md`。
- 建立聚合、实体、生命周期、关系基数、状态和枚举口径。
- 每条实体、关系和状态必须能追溯到 PRD、任务或已确认决策。

3. **设计物理模型**
- 基于逻辑模型输出表、字段、主键、唯一约束、普通索引和多租户/组织隔离口径。
- 新增表默认包含统一基础字段；豁免必须写明原因。
- 已存在共享表默认只输出 `ALTER TABLE` / `CREATE INDEX`，不重复展开整表快照。

4. **冻结 SQL 契约与兼容方案**
- 读取 `references/physical-schema-template.sql`。
- 新项目或无参考 SQL 时，按本文件“无参考默认规范”冻结 SQL 目录、基础字段和 DML 写入口径。
- 命中 schema 变更时产出 DDL 汇总和 append-only delta 契约。
- 命中存量数据影响时产出 history compat 契约，并说明幂等、回滚和灰度策略。
- 状态/类型字段码值明确时，同步字典初始化方案与枚举变更说明。
- 需要交给 `server/persistence-impl` 落 SQL 文件时，输出持久化需求表：表/实体、字段/索引变化、查询条件、排序字段、唯一/防重键、批量操作、租户/open 边界和预期持久化方法。
- 需要从物理 SQL 生成字典初始化 SQL 与枚举草案时，可按需使用 `scripts/gen_dict_sql_and_enums.py`。
- 新增独立 SQL 文件前，按 `references/rules/data-model-sql.md` 的“SQL 目录与命名”确定 SQL 目录、排序号段、任务 ID、短文件名与 manifest；路径表达变更和设计稿归属，文件名表达排序号、来源和用途，最终执行顺序仍以 manifest 为准。

5. **校验**
- 按需执行 `diff`、schema checker 或项目已有 SQL 校验脚本，校验 `design/<design-package>/sql/` 与 `server/docker-config/sql/<design-package>/` 双写一致。
- 检查逻辑模型、物理 SQL、字典/枚举、SQL 契约与 API/状态机是否一致。
- 未确认码值、唯一性、迁移方式或外部主数据边界时，只能输出“评审版”。

## 规则与约束

- 数据模型、SQL、命名、基础字段、兼容回滚和并行防冲突规则统一在 `references/rules/INDEX.md` 中按规则索引读取。
- 本文件只保留工作流、输入输出和关键路由；若与本地规则包冲突，以 `references/rules/` 命中的规则文件为准。

## 无参考默认规范

- SQL 设计侧目录：`ai-workflow/sdd/changes/<change-id>/design/<design-package>/sql/`。
- SQL 运行侧目录：`server/docker-config/sql/<design-package>/`。
- 两侧目录都维护 `manifest.md`，SQL 文件名、内容和执行顺序保持一致。
- 新增业务表默认字段：`ID BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID'`、`STATUS INT NOT NULL DEFAULT 1 COMMENT '数据状态（0-删除、1-正常）'`、`REMARK VARCHAR(255) NULL COMMENT '备注'`、`CREATE_BY VARCHAR(64) NULL COMMENT '创建人'`、`CREATE_TIME DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'`、`UPDATE_BY VARCHAR(64) NULL COMMENT '更新人'`、`UPDATE_TIME DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'`、`ORG_CODE VARCHAR(64) NULL COMMENT '组织编码'`、`TENANT_ID BIGINT NULL COMMENT '租户ID'`。
- DML 可以显式写入 `STATUS`、`CREATE_BY`、`UPDATE_BY`；禁止显式写入 `CREATE_TIME`、`UPDATE_TIME`，由数据库维护。
- `TENANT_ID`、`ORG_CODE` 默认生成；确认为无租户/组织隔离表时可豁免并记录原因。

## 完成标准

- 每条业务规则都能追溯到 PRD、任务或已确认决策。
- 每张表都包含基础字段，或给出豁免原因。
- 关系表、唯一性约束、关键索引有明确说明。
- SQL 契约可交给 `server/persistence-impl` 落地，并已说明设计侧与运行侧双写路径。
- 状态/类型字段的字典与枚举口径明确。
- 多租户、组织隔离、存量兼容和回滚口径明确。
- 若后续需要生成 DAO/Mapper/Manager，已输出持久化需求表；不涉及时说明依据。
