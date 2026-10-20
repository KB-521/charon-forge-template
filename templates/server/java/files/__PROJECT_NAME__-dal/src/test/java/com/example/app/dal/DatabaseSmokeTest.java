package com.example.app.dal;

import com.example.app.dal.config.MapperConfiguration;
import com.example.app.dal.probe.dao.ProbeMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import static org.junit.jupiter.api.Assertions.assertEquals;

@ActiveProfiles("test")
@SpringBootTest(classes = DatabaseSmokeTest.TestConfiguration.class,
    webEnvironment = SpringBootTest.WebEnvironment.NONE, properties = {
        "spring.datasource.url=jdbc:h2:mem:mapper-test;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password="
    })
class DatabaseSmokeTest {
    @Autowired
    private ProbeMapper mapper;

    @Test
    void standardMapperExecutesAgainstInMemoryDatabase() {
        assertEquals(1, mapper.selectOne());
    }

    @Configuration
    @EnableAutoConfiguration
    @Import(MapperConfiguration.class)
    static class TestConfiguration {}
}
