-- 物理表结构模板：[项目/功能名]
-- 说明：
-- 1) 本文件应与主文档 6.1 存储模型、逻辑数据模型一致；语义是“当前需求 DDL 汇总”，不是共享表当前态快照。
-- 2) 每张核心表需包含：主键、关键索引、关联表id建索引（可选）、唯一约束（可选）、审计字段。
-- 3) 表名前缀（强制）：新增表前必须先确认表前缀或项目标识，禁止凭空猜测。
--    来源优先级：用户显式指定表前缀 > 变更包/PRD/设计/AGENTS/README 指定的项目名或表前缀 > 目标代码子项目/模块目录名 >
--    Maven artifactId/module/package 等构建元信息 > 已有 SQL/表名约定。
--    从模块名识别项目标识时，先剥离技术分层后缀，如 `-domain`、`-dal`、`-biz`、`-web`、`-manager`、`-service`、`-api`、`-starter`。
--    未指定表前缀但已确认项目标识时，默认将项目标识转大写下划线并追加 `_`；例如目标模块/项目名为 `soyii-mobile` 时派生 `SOYII_MOBILE_`。
--    若派生结果与已有 SQL 或用户指定不一致，以用户指定或已有 SQL 为准；仍无法确认时输出 BLOCKER，不生成新增表。
-- 4) 命名规则：表名、字段名都大写，下划线分割；新增表名必须以已确认表前缀开头。
-- 5) 基础字段必须包含：ID、REMARK、STATUS、CREATE_BY、CREATE_TIME、UPDATE_BY、UPDATE_TIME、ORG_CODE、TENANT_ID。
-- 6) UNIQUE KEY 仅用于“必须强约束”的业务唯一性；可容忍重复且仅用于排序/检索的字段使用普通 KEY。
-- 7) 外部系统主数据默认不重复建模；确需镜像时需在设计文档说明缓存、离线或审计必要性。
-- 8) 字典表：固定有这个表，字典表命名规则：<已确认表前缀>DICTIONARY，例如 `SOYII_MOBILE_DICTIONARY`
-- 9) 生成后必须校验设计侧与运行侧 SQL 双写一致；优先使用项目已有 schema checker，没有时至少执行 diff。
-- 10) 若个别表字段确需豁免，请在 CREATE TABLE 前增加：-- BASE_FIELD_EXEMPT: ORG_CODE，并在设计文档记录原因与评审结论。
-- 11) 时间字段默认值（强制）：
--     - `CREATE_TIME` 必须声明为：datetime DEFAULT CURRENT_TIMESTAMP
--     - `UPDATE_TIME` 必须声明为：datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
-- 12) 时间字段写入规则（强制）：
--     - `CREATE_TIME` / `UPDATE_TIME` 由数据库维护，业务 SQL（INSERT/UPDATE）禁止显式写入这两个字段。
-- 13) 状态/类型字段注释规则（强制）：
--     - 注释中必须同时包含“字典类型编码 + 可解析码值”，否则无法自动生成字典 SQL 与枚举。
--     - 推荐格式：
--       a) `字段说明(XXX_TYPE, code1:说明1/code2:说明2)`
--       b) `字段说明(XXX_TYPE, code1.说明1 code2.说明2)`
--       c) `字段说明(XXX_TYPE, code1-说明1 code2-说明2)`
--     - 禁止仅写 `字段说明(XXX_TYPE)` 或仅写中文值（如 `待分配/已分配`）但无码值。
-- 14) SQL 目录、排序号段、短文件名与并行防冲突（强制）：
--     - 所有 schema、初始化、兼容、迁移、回滚 SQL 按设计稿聚合到同一目录：
--       设计侧：`design/<design-package>/sql/<order>-<task-id>-<sql-kind>.sql`
--       运行侧：`server/docker-config/sql/<design-package>/<order>-<task-id>-<sql-kind>.sql`
--     - `<sql-kind>` 使用：`schema-delta`、`dict-init`、`data-compat`、`migration`、`rollback`。
--     - `<order>` 必须来自父计划分配的 SQL Order Range，例如 `0100-0199`；并行任务只能写自己的号段。
--     - 同一任务同类 SQL 多于一个时追加短语义，例如 `0100-REQ-XXX-01-schema-delta-wallet-account.sql`。
--     - 禁止只用当日递增序号作为唯一来源，例如禁止新建 `001.sql`、`20260704-001.sql`。
--     - SQL 执行顺序写入 `sql/manifest.md` 与 `server/docker-config/sql/<design-package>/manifest.md`，文件名前缀用于大批量 SQL 的人工排序和发布辅助排序。
--     - design 与 `server/docker-config/sql/` 双写时，两边文件名和内容必须一致。
-- 15) 增量 DDL 规则（强制）：
--     - 新增表使用 `CREATE TABLE`；已存在共享表默认仅使用 `ALTER TABLE` / `CREATE INDEX`，禁止重复展开原表全量定义。
--     - 使用 `ALTER TABLE ... ADD COLUMN` 新增状态/类型字段时，也必须遵守第13条注释规则。
--     - 若确需对已存在共享表输出整表 `CREATE TABLE`，必须在对应语句前紧邻添加：
--       `-- EXISTING_TABLE_RECREATE_ALLOWED: <reason>`
--       且设计文档中必须给出结构化重构说明、迁移方案与回滚方案。
-- 示例：目标模块 `server-mobile/soyii-mobile-domain` 先剥离分层后缀 `-domain`，确认项目标识为 `soyii-mobile`，派生表前缀为 `SOYII_MOBILE_`
CREATE TABLE IF NOT EXISTS `SOYII_MOBILE_ENTITY` (
    `ID` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键',
    `NAME` VARCHAR(128) NOT NULL COMMENT '名称',
    `REMARK` text COMMENT '备注',
    `STATUS` tinyint(4) DEFAULT NULL COMMENT '状态(SOYII_MOBILE_ENTITY_STATUS, 0:已删除/1:正常)',
    `CREATE_BY` varchar(45) DEFAULT NULL COMMENT '创建人',
    `CREATE_TIME` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `UPDATE_BY` varchar(45) DEFAULT NULL COMMENT '修改人',
    `UPDATE_TIME` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '修改时间',
    `ORG_CODE` varchar(45) DEFAULT NULL COMMENT '组织编码',
    `TENANT_ID` bigint(20) NOT NULL COMMENT '租户ID',
  PRIMARY KEY (`ID`),
  KEY `idx_NAME` (`NAME`),
  KEY `idx_STATUS` (`STATUS`),
  KEY `idx_CREATE_BY` (`CREATE_BY`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4  COMMENT='示例实体';

-- 共享表增量示例（推荐）
ALTER TABLE `SOYII_MOBILE_EXISTING_ENTITY`
  ADD COLUMN `NEW_FIELD` VARCHAR(64) NULL COMMENT '新增字段(SOYII_MOBILE_EXISTING_ENTITY_FIELD_TYPE, a:方案A/b:方案B)';

CREATE INDEX `IDX_SOYII_MOBILE_EXISTING_ENTITY_NEW_FIELD`
  ON `SOYII_MOBILE_EXISTING_ENTITY` (`NEW_FIELD`);

--字典表
CREATE TABLE `SOYII_MOBILE_DICTIONARY` (
  `ID` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键',
  `DIC_CODE` varchar(128) NOT NULL COMMENT '字典编码',
  `DIC_NAME` varchar(128) NOT NULL COMMENT '字典名称',
  `DIC_TYPE` varchar(64) NOT NULL COMMENT '字典类型',
  `PARENT_CODE` varchar(64) DEFAULT '0' COMMENT '父字典编码(顶级为0)',
  `DIC_LEVEL` int(11) DEFAULT '1' COMMENT '级别（子母表层级，1级代表顶级）',
  `DIC_SORT` int(11) unsigned DEFAULT '1' COMMENT '排序',
  `STATUS` tinyint(3) NOT NULL COMMENT '是否可用(SOYII_MOBILE_DICTIONARY_STATUS, 0:不可用/1:可用)',
  `REMARK` text COMMENT '备注',
  `CREATE_BY` varchar(45) DEFAULT NULL COMMENT '创建人',
  `CREATE_TIME` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `UPDATE_BY` varchar(45) DEFAULT NULL COMMENT '更新人',
  `UPDATE_TIME` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `TENANT_ID` bigint(20) NOT NULL COMMENT '租户ID',
  `ORG_CODE` varchar(45) DEFAULT NULL COMMENT '组织编码',
  PRIMARY KEY (`ID`),
  UNIQUE KEY `uk_code_type_level` (`DIC_CODE`,`DIC_TYPE`,`DIC_LEVEL`) USING BTREE,
  KEY `idx_parent_code` (`PARENT_CODE`) USING BTREE,
  KEY `NORMAL_CREATE` (`CREATE_BY`,`CREATE_TIME`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4  COMMENT='数据字典表'
;
