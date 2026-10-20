---
name: persistence-impl
description: 根据已冻结的数据模型、SQL 目录规则和发布顺序，生成或修改后端 SQL 文件，包括 DDL、DML、schema delta、history compat、数据修复、回滚/补救 SQL 与 manifest；支持无参考时按默认规范生成 SQL，不生成 Java 持久化骨架、业务 Service 或对外 Endpoint/Controller。
version: 1.3.1
owners:
  - sunwencong
---

# 后端 SQL 文件实现

## 目标

把冻结的数据模型和变更方案落成可执行、可排序、可回滚或可补救的 SQL 文件。优先复用同设计稿/同项目 SQL 约定；没有参考时，按默认规范独立生成 DDL/DML/manifest。

本 skill 只负责 SQL 文件。Java 持久化骨架转 `server/skeleton-codegen`。

## 命中场景

- 新增或修改 DDL：表、字段、索引、唯一约束、默认值、注释。
- 新增或修改 DML：初始化数据、字典数据、配置数据、数据修复、兼容回填。
- 需要生成 schema delta、history compat、rollback/fixforward SQL、SQL manifest。
- 需要按设计稿 SQL 目录和序号规则整理大批量 SQL 文件。

## 不适用场景

- generator、PO/POQuery、DAO/Repository、Mapper XML、sqlmapplus/OpenDAO、薄 Manager：转 `server/skeleton-codegen`。
- 业务规则、事务、状态机、幂等、外部能力：转 `server/req-impl`。
- Endpoint/Controller、DTO/VO、路由、响应封装、YApi：转 `server/entry-impl`。
- 逻辑模型、字段语义、索引策略或兼容口径未冻结：转 `server/data-model-design`。
- Java unit / api-mock 测试代码：转 `server/test-codegen`。

## 输入

- 冻结的数据模型：表、字段、索引、唯一约束、字典/枚举、兼容结论。
- 设计稿 SQL 目录规则、运行侧 SQL 目录规则、文件命名规则、序号规则、manifest 规则。
- 目标数据库类型、目标环境、是否需要可重复执行、发布顺序和回滚/补救要求。
- DML 数据来源、影响范围、幂等依据和执行窗口。
- 新项目或无历史参考时，读取 `references/default-generation.md` 作为本 skill 的 SQL 默认生成规范。

## 读取顺序

1. 读取目标项目 `AGENTS.md` 或等价说明。
2. 读取 `references/rules/INDEX.md`，按规则索引命中规则。
3. 有参考 SQL 时读取 `references/convention-discovery.md` 并用 `rg` 查同设计稿/同项目 SQL。
4. 无参考 SQL 或需要默认生成时读取 `references/default-generation.md`。
5. 按产物读取模板：`templates/ddl.md`、`templates/dml.md`、`templates/manifest.md`。

## 执行顺序

1. **冻结输入**：确认表、字段、索引、唯一约束、默认值、字典/枚举、兼容口径和执行顺序。
2. **确定规范**：优先同设计稿/同项目参考；无参考则按默认规范生成，并标注默认规范来源。
3. **生成 SQL**：生成 DDL、DML、schema delta、history compat、rollback 或 fixforward SQL，并双写到设计侧和运行侧目录。
4. **自检交付**：检查双写一致、排序、幂等、where、索引、锁表风险、回滚/补救和 manifest。

## 核心门禁

- 未冻结数据模型、索引和兼容结论，禁止生成 SQL 文件。
- 无法确认 SQL 目录、文件命名序号或目标数据库类型时，输出 BLOCKER。
- DML 缺少数据来源、影响范围、幂等依据或强 where 条件时，禁止交付。
- DDL 缺少默认值、历史数据、老代码兼容、索引影响和发布顺序说明时，禁止交付。
- 同一设计稿 SQL 不拆到多个子任务文件夹；文件名必须可排序。
- SQL 文件必须双写到 `design/<design-package>/sql/` 和 `server/docker-config/sql/<design-package>/`，两边文件名、内容和 manifest 执行顺序一致。
- 本 skill 不生成 Java 持久化代码。

## 交付

- 输入引用、默认/参考规范来源、设计侧和运行侧 SQL 文件清单。
- DDL/DML/manifest 内容摘要、执行顺序、幂等、影响范围、回滚或补救说明。
- 需要交给 `server/skeleton-codegen` 的表、字段、索引和 SQL 文件引用。
- 验证命令、结果或未执行原因；剩余风险。
