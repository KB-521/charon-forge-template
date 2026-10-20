package com.example.app.dal.probe.dao;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface ProbeMapper {
    @Select("SELECT 1")
    int selectOne();
}
