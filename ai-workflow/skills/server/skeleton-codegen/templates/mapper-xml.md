# Mapper XML Template

XML 必须根据表结构完整展开，不保留占位字段。

## 必备结构

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="<rootPackage>.dal.dao.<EntityName>DAO">

    <resultMap id="BaseResultMap" type="<rootPackage>.domain.po.<EntityName>PO">
        <id column="ID" jdbcType="BIGINT" property="id"/>
        <result column="<COLUMN_NAME>" jdbcType="<JDBC_TYPE>" property="<propertyName>"/>
    </resultMap>

    <sql id="Base_Column_List">
        t.ID,
        t.<COLUMN_NAME>
    </sql>

    <sql id="Query_Table">
        <TABLE_NAME> t
    </sql>

    <select id="selectByPrimaryKey" parameterType="Long" resultMap="BaseResultMap">
        select <include refid="Base_Column_List"/>
        from <include refid="Query_Table"/>
        <where>and t.ID = #{id}</where>
    </select>

    <select id="selectByPrimaryKeys" resultMap="BaseResultMap">
        select <include refid="Base_Column_List"/>
        from <include refid="Query_Table"/>
        <where>
            t.ID in
            <foreach item="item" collection="array" separator="," open="(" close=")">#{item}</foreach>
        </where>
    </select>

    <select id="selectByCondition" parameterType="<rootPackage>.domain.po.query.<EntityName>POQuery"
            resultMap="BaseResultMap">
        select <include refid="Base_Column_List"/>
        from <include refid="Query_Table"/>
        <where>
            <if test="id != null">and t.ID = #{id}</if>
            <if test="idList != null and idList.size() > 0">
                and t.ID in
                <foreach item="item" collection="idList" separator="," open="(" close=")">#{item}</foreach>
            </if>
            <if test="<propertyName> != null">and t.<COLUMN_NAME> = #{<propertyName>}</if>
            <if test="<propertyName>List != null and <propertyName>List.size() > 0">
                and t.<COLUMN_NAME> in
                <foreach item="item" collection="<propertyName>List" separator="," open="(" close=")">#{item}</foreach>
            </if>
            <if test="<timeProperty>Start != null">and t.<TIME_COLUMN> &gt;= #{<timeProperty>Start}</if>
            <if test="<timeProperty>End != null">and t.<TIME_COLUMN> &lt;= #{<timeProperty>End}</if>
        </where>
    </select>

    <insert id="insertSelective" keyColumn="ID" keyProperty="id" useGeneratedKeys="true"
            parameterType="<rootPackage>.domain.po.<EntityName>PO">
        insert into <TABLE_NAME>
        <trim prefix="(" suffix=")" suffixOverrides=",">
            <if test="<propertyName> != null"><COLUMN_NAME>,</if>
        </trim>
        <trim prefix="values (" suffix=")" suffixOverrides=",">
            <if test="<propertyName> != null">#{<propertyName>,jdbcType=<JDBC_TYPE>},</if>
        </trim>
    </insert>

    <update id="updateByPrimaryKeySelective" parameterType="<rootPackage>.domain.po.<EntityName>PO">
        update <TABLE_NAME>
        <set>
            <if test="<propertyName> != null"><COLUMN_NAME> = #{<propertyName>,jdbcType=<JDBC_TYPE>},</if>
        </set>
        where ID = #{id,jdbcType=BIGINT}
    </update>
</mapper>
```

## 展开规则

- `BaseResultMap` 覆盖所有 PO 字段和需要映射的 BasePO 字段。
- `Base_Column_List` 覆盖所有查询返回字段。
- `selectByCondition` 只生成 POQuery 中存在的条件。
- `insertSelective`、`updateByPrimaryKeySelective` 覆盖所有可写字段；自增主键不进入 insert。
- 逻辑删除、租户字段、状态字段不自动加隐式条件，除非数据模型或需求明确。
- DAO 方法、XML statement id、参数类型和返回必须一致。
