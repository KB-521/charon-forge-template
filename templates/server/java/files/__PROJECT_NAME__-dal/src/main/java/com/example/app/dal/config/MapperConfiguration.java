package com.example.app.dal.config;

import org.apache.ibatis.annotations.Mapper;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("!local")
@MapperScan(basePackages = "com.example.app.dal.**.dao", annotationClass = Mapper.class)
public class MapperConfiguration {}
