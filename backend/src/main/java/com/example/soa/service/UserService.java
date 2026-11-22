package com.example.soa.service;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.example.soa.model.User;
import com.example.soa.repository.UserRepository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@Service
public class UserService {

    private final UserRepository userRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public boolean authenticate(String userName, String password) {
        if (userName == null || password == null) {
            return false;
        }

        String trimmedUser = userName.trim();
        String decodedPassword = decodeBase64(password);

        // 1. Tài khoản mặc định admin/123456
        if ("admin".equalsIgnoreCase(trimmedUser)) {
            if ("123456".equals(password) || "123456".equals(decodedPassword)) {
                return true;
            }
        }

        // 2. Kiểm tra trong bảng user
        Optional<User> optionalUser = userRepository.findByUserName(trimmedUser);
        if (optionalUser.isPresent()) {
            String storedPassword = optionalUser.get().getPassword();
            if (storedPassword != null && (storedPassword.equals(password) || storedPassword.equals(decodedPassword))) {
                return true;
            }
        }

        // 3. Fallback kiểm tra bảng users (nếu database dùng bảng users từ baisoa.sql)
        try {
            @SuppressWarnings("unchecked")
            List<Object> results = entityManager
                    .createNativeQuery("SELECT Password FROM users WHERE LOWER(UserName) = LOWER(:u)")
                    .setParameter("u", trimmedUser)
                    .getResultList();
            for (Object row : results) {
                if (row != null) {
                    String stored = row.toString();
                    if (stored.equals(password) || stored.equals(decodedPassword)) {
                        return true;
                    }
                }
            }
        } catch (Exception ignored) {
        }

        return false;
    }

    public boolean exists(String userName) {
        if (userName == null) return false;
        if ("admin".equalsIgnoreCase(userName.trim())) return true;
        return userRepository.existsByUserName(userName.trim());
    }

    private String decodeBase64(String value) {
        try {
            return new String(Base64.getDecoder().decode(value), StandardCharsets.UTF_8);
        } catch (IllegalArgumentException e) {
            return value;
        }
    }
    public User register(String userName, String password) {
        if (userName == null || userName.isBlank() || password == null || password.isBlank()) {
            throw new IllegalArgumentException("Username và Password không được để trống");
        }
        String trimmed = userName.trim();
        if (exists(trimmed)) {
            throw new IllegalArgumentException("Tài khoản '" + trimmed + "' đã tồn tại");
        }
        return userRepository.save(new User(trimmed, password.trim()));
    }
}