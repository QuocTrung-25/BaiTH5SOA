package com.example.jwtapi.service;

import java.util.Base64;

import org.springframework.stereotype.Service;

import com.example.jwtapi.model.User;

@Service
public class UserService {

    // Demo lab: tài khoản nằm trong bộ nhớ, chưa dùng database.
    // Mật khẩu "123456" được lưu dạng Base64: MTIzNDU2
    private final User demoUser = new User("admin","MTIzNDU2","ADMIN");

    public boolean authenticate(String userName, String encodedPassword) {
        return demoUser.getUsername().equals(userName)
                && demoUser.getPassword().equals(encodedPassword);
    }

    public boolean exists(String userName) {
        return demoUser.getUsername().equals(userName);
    }

    public String getDemoEncodedPassword() {
        return Base64.getEncoder().encodeToString("123456".getBytes());
    }
}
