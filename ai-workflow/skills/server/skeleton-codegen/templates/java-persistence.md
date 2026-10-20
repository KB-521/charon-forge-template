# Java Persistence Templates

模板中的包名、类名和字段必须由冻结 SQL/数据模型展开，不保留占位字段。

## Generator

```text
generator/table config:
- tableName: <TABLE_NAME>
- objectName: <EntityName>
- packageName: <root package>
- enableController: false
- enableService: false
- fields: <all columns with property/javaType/jdbcType/comment>
```

## Metac Profile PO

```java
package <rootPackage>.domain.po;

import com.metac.base.domain.po.BasePO;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
public class <EntityName>PO extends BasePO<Long> {

    /**
     * <field comment>
     */
    private <JavaType> <propertyName>;
}
```

要求：
- 按表字段顺序生成 PO 字段。
- `ID` 和 BasePO 已承接字段不重复生成。
- 字符串长度来自 SQL 长度，生成 `@Size(max = n)`；必要时生成 `@NotNull`。

## Generic Profile PO

```java
package <rootPackage>.domain.po;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class <EntityName>PO {

    private Long id;
    private Integer status;
    private String remark;
    private String createBy;
    private LocalDateTime createTime;
    private String updateBy;
    private LocalDateTime updateTime;
    private String orgCode;
    private Long tenantId;
    private <JavaType> <propertyName>;
}
```

要求：
- Generic Profile 必须显式声明全部表字段。
- 字段顺序与 SQL 字段顺序一致。

## Metac Profile POQuery

```java
package <rootPackage>.domain.po.query;

import java.time.LocalDateTime;
import java.util.List;

import com.metac.base.domain.po.PagePOQuery;
import com.metac.base.domain.po.sort.annotation.SortField;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
@SortField({
        "id:t.ID",
        "createTime:t.CREATE_TIME"
})
public class <EntityName>POQuery extends PagePOQuery {

    private Long id;
    private List<Long> idList;
    private <JavaType> <propertyName>;
    private List<<JavaType>> <propertyName>List;
    private LocalDateTime <timeProperty>Start;
    private LocalDateTime <timeProperty>End;
}
```

要求：
- 只生成需要查询/排序的字段。
- 时间范围字段和 List 字段必须在 XML 中有对应动态条件。

## Generic Profile Query

```java
package <rootPackage>.domain.po.query;

import java.time.LocalDateTime;
import java.util.List;
import lombok.Data;

@Data
public class <EntityName>POQuery {

    private Integer pageNum;
    private Integer pageSize;
    private Long id;
    private List<Long> idList;
    private Integer status;
    private String orgCode;
    private Long tenantId;
    private <JavaType> <propertyName>;
    private List<<JavaType>> <propertyName>List;
    private LocalDateTime <timeProperty>Start;
    private LocalDateTime <timeProperty>End;
}
```

## Metac Profile DAO

```java
package <rootPackage>.dal.dao;

import org.apache.ibatis.annotations.Mapper;
import com.metac.base.mybatis.dal.dao.CrudDAO;
import <rootPackage>.domain.po.<EntityName>PO;

@Mapper
public interface <EntityName>DAO extends CrudDAO<<EntityName>PO, Long> {

}
```

要求：
- 基础 CRUD 由 `CrudDAO` 承接，不重复声明。
- 自定义 XML statement 必须声明同名 DAO 方法。

## Generic Profile DAO

```java
package <rootPackage>.dal.dao;

import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import <rootPackage>.domain.po.<EntityName>PO;
import <rootPackage>.domain.po.query.<EntityName>POQuery;

@Mapper
public interface <EntityName>DAO {

    <EntityName>PO selectByPrimaryKey(@Param("id") Long id);

    List<<EntityName>PO> selectByPrimaryKeys(@Param("ids") Long[] ids);

    List<<EntityName>PO> selectByCondition(<EntityName>POQuery query);

    int insertSelective(<EntityName>PO record);

    int updateByPrimaryKeySelective(<EntityName>PO record);
}
```

## Metac Profile Manager

```java
package <rootPackage>.dal.manager;

import org.springframework.stereotype.Component;
import com.metac.base.mybatis.dal.manager.BaseCrudManager;
import <rootPackage>.dal.dao.<EntityName>DAO;
import <rootPackage>.domain.po.<EntityName>PO;

@Component
public class <EntityName>Manager extends BaseCrudManager<<EntityName>DAO, <EntityName>PO, Long> {

}
```

要求：
- 默认只继承 `BaseCrudManager`。
- 只允许新增对 DAO 自定义方法的薄透传，不写业务规则。

## Generic Profile Manager

```java
package <rootPackage>.dal.manager;

import java.util.List;
import org.springframework.stereotype.Component;
import <rootPackage>.dal.dao.<EntityName>DAO;
import <rootPackage>.domain.po.<EntityName>PO;
import <rootPackage>.domain.po.query.<EntityName>POQuery;

@Component
public class <EntityName>Manager {

    private final <EntityName>DAO <entityName>DAO;

    public <EntityName>Manager(<EntityName>DAO <entityName>DAO) {
        this.<entityName>DAO = <entityName>DAO;
    }

    public <EntityName>PO selectByPrimaryKey(Long id) {
        return <entityName>DAO.selectByPrimaryKey(id);
    }

    public List<<EntityName>PO> selectByCondition(<EntityName>POQuery query) {
        return <entityName>DAO.selectByCondition(query);
    }

    public int insertSelective(<EntityName>PO record) {
        return <entityName>DAO.insertSelective(record);
    }

    public int updateByPrimaryKeySelective(<EntityName>PO record) {
        return <entityName>DAO.updateByPrimaryKeySelective(record);
    }
}
```
