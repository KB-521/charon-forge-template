package com.example.app.health;

import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {
    private final String service;

    public HealthController(@Value("${spring.application.name}") String service) {
        this.service = service;
    }

    @GetMapping("/check")
    public Map<String, String> check() {
        Map<String, String> result = new LinkedHashMap<>();
        result.put("status", "ok");
        result.put("service", service);
        return result;
    }
}
