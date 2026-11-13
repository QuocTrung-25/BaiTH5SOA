package com.example.jwtapi.service;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class UserService {
    private static final String FIND_PASSWORD_SQL =
            "SELECT `Password` FROM `user` WHERE BINARY `UserName` = BINARY ? LIMIT 1";

    private final JdbcTemplate jdbcTemplate;

    public UserService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public boolean authenticate(String userName, String password) {
        if (userName == null || password == null) {
            return false;
        }

        try {
            String storedPassword = jdbcTemplate.queryForObject(
                    FIND_PASSWORD_SQL, String.class, userName);
            String decodedPassword = decodeBase64(password);
            return storedPassword != null
                    && (storedPassword.equals(password) || storedPassword.equals(decodedPassword));
        } catch (EmptyResultDataAccessException exception) {
            return false;
        }
    }

    public boolean exists(String userName) {
        if (userName == null) {
            return false;
        }
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM `user` WHERE BINARY `UserName` = BINARY ?",
                Integer.class,
                userName);
        return count != null && count > 0;
    }

    public String getDemoEncodedPassword() {
        return Base64.getEncoder().encodeToString("123456".getBytes(StandardCharsets.UTF_8));
    }

    private String decodeBase64(String value) {
        try {
            return new String(Base64.getDecoder().decode(value), StandardCharsets.UTF_8);
        } catch (IllegalArgumentException exception) {
            return value;
        }
    }
}
