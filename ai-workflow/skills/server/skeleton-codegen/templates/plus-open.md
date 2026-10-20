# Plus And Open Templates

Plus/Open 是按需能力。普通 CRUD 骨架不默认生成 PlusDAO、PlusMapper 或 OpenDAO。

## PlusDAO / PlusMapper

适用：基础 Mapper 无法承接的自定义查询/更新。

```java
package <rootPackage>.dal.daoplus;

import <rootPackage>.dal.dao.<EntityName>DAO;

public interface <EntityName>PlusDAO extends <EntityName>DAO {
    <ReturnType> <customMethod>(<ParamType> param);
}
```

```xml
<mapper namespace="<rootPackage>.dal.daoplus.<EntityName>PlusDAO">
    <select id="<customMethod>" resultMap="<rootPackage>.dal.dao.<EntityName>DAO.BaseResultMap">
        select
        <include refid="<rootPackage>.dal.dao.<EntityName>DAO.Base_Column_List"/>
        from <TABLE_NAME> t
        <where>
            <!-- confirmed custom conditions -->
        </where>
    </select>
</mapper>
```

要求：
- 优先复用基础 DAO 的 `BaseResultMap` 和 `Base_Column_List`。
- 自定义方法必须有调用方需求、入参、返回和索引依据。

## OpenDAO / OpenMapper

适用：跨租户、全局扫描、调度扫描或 open 查询需求明确。

```java
public interface <ProjectOpenDAO> {
    int update<EntityName>Selective(<EntityName>PO record);
}
```

```xml
<update id="update<EntityName>Selective" parameterType="<rootPackage>.domain.po.<EntityName>PO">
    update <TABLE_NAME>
    <set>
        <if test="<propertyName> != null"><COLUMN_NAME> = #{<propertyName>,jdbcType=<JDBC_TYPE>},</if>
    </set>
    where ID = #{id,jdbcType=BIGINT}
</update>
```

要求：
- 优先扩展项目既有 OpenDAO/OpenMapper；无 OpenDAO 约定时不新增 open 能力，只输出缺口。
- 必须说明调用方、数据范围、分页/限流、字段边界和租户隔离依据。
