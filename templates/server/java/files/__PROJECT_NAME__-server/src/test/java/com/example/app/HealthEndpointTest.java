package com.example.app;

import java.util.Map;
import javax.sql.DataSource;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.context.ApplicationContext;
import org.springframework.test.context.ActiveProfiles;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@ActiveProfiles("local")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class HealthEndpointTest {
    @Autowired
    private TestRestTemplate rest;

    @Autowired
    private ApplicationContext context;

    @Test
    void localHealthDoesNotRequireDatabase() {
        assertEquals("ok", rest.getForObject("/check", Map.class).get("status"));
        assertEquals("UP", rest.getForObject("/actuator/health", Map.class).get("status"));
        assertEquals(404, rest.getForEntity("/not-an-endpoint", String.class).getStatusCodeValue());
    }

    @Test
    void localProfileDoesNotCreateDataSource() {
        assertTrue(context.getBeansOfType(DataSource.class).isEmpty());
    }
}
