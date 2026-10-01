package com.example.jwtapi.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/hello")
public class HelloController {

    @GetMapping
    public ResponseEntity<Map<String, String>> sayHello() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Hello, JWT Authentication successful!");
        return ResponseEntity.ok(response);
    }
}