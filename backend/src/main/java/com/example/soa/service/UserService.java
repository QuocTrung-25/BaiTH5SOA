package com.example.soa.service;

import com.example.soa.model.User;
import com.example.soa.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public boolean authenticate(String userName, String password) {
        if (userName == null || password == null) {
            return false;
        }

        String decodedPassword = decodeBase64(password);

        // Fallback default admin credentials
        if ("admin".equalsIgnoreCase(userName.trim())) {
            if ("123456".equals(password) || "123456".equals(decodedPassword)) {
                return true;
            }
        }

        Optional<User> optionalUser = userRepository.findByUserName(userName.trim());
        if (optionalUser.isPresent()) {
            String storedPassword = optionalUser.get().getPassword();
            return storedPassword != null && (storedPassword.equals(password) || storedPassword.equals(decodedPassword));
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
}
