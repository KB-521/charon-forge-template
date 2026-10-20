# Field Change Matrix

字段新增或变更时，必须按用途判断全链路影响，不能只改 PO 或 SQL。

## 新增字段

| 字段用途 | 需要检查/生成 | 常见风险 |
| --- | --- | --- |
| 仅持久化 | DDL、PO、resultMap、insert/update、默认值、历史数据。 | 只加字段不写入，默认值与代码语义不一致。 |
| 查询条件 | Query、Mapper 动态 SQL、索引、分页条件、Manager/service 方法入参。 | 只加 Query 不改 XML；条件未命中索引。 |
| 排序字段 | Query 排序参数、白名单、索引、分页稳定性。 | 直接拼 order by；分页结果不稳定。 |
| 写入入参 | PO/Mapper 写入字段、默认值、更新策略；DTO/request 和 service 校验转 `entry-impl`/`req-impl`。 | 老客户端未传字段导致覆盖默认值。 |
| 输出字段 | PO/Mapper 查询字段、字段投影；VO/response、脱敏、YApi 字段说明转 `entry-impl`。 | 内部字段外泄；未同步文档。 |
| 状态/类型 | enum、dict、状态机、查询条件、展示文案、兼容默认值。 | 魔法值散落；老状态无法识别。 |
| 租户/组织 | 权限过滤、open 链路、索引、数据隔离。 | 绕过既有租户条件。 |
| 审计/日志 | create/update/user/time、操作日志、回填策略。 | 审计字段与现有基类重复。 |
| 幂等/锁 | 唯一键、业务幂等键、锁粒度、重复请求语义。 | 唯一约束缺失或冲突处理不明确。 |

## 字段变更

| 变更类型 | 需要检查/生成 | 常见风险 |
| --- | --- | --- |
| 类型变更 | SQL 兼容、PO 类型、Mapper jdbcType、历史数据；DTO/VO 类型影响转 `entry-impl`。 | 线上数据无法转换；调用方编译或序列化失败。 |
| 字段改名 | SQL rename/兼容列、PO/Query/Mapper；DTO/VO/YApi 影响转 `entry-impl`。 | 老 SQL、老客户端或报表仍读旧字段。 |
| code 值变更 | enum/dict、状态机、前端展示、历史数据迁移、回滚。 | 旧 code 与新 code 混用。 |
| 默认值变更 | SQL 默认值、PO/Mapper 写入默认语义、老数据回填；service 默认值转 `req-impl`。 | DB 默认和代码默认不一致。 |
| 查询语义变更 | Query、Mapper 条件、索引、分页、权限过滤。 | 查询结果扩大或缩小导致兼容问题。 |
| 删除字段 | 读写调用方、YApi、报表、兼容窗口、回滚方案。 | 仍有历史调用方依赖字段。 |

## 禁止项

- 禁止只改 PO/Entity，不改 Mapper/resultMap/insert/update。
- 禁止只改 SQL，不检查 generator 和代码映射。
- 禁止只加 Query 字段，不改 Mapper 动态 SQL 和索引判断。
- 禁止在本 skill 生成 DTO/VO/Endpoint；发现入口字段影响时转 `server/entry-impl`。
- 禁止状态/类型字段不落 enum/dict 或兼容默认值。
