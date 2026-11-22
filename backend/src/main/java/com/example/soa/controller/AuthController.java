package com.example.soa.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.example.soa.dto.LoginRequest;
import com.example.soa.dto.LoginResponse;
import com.example.soa.service.JwtService;
import com.example.soa.service.UserService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserService userService;
    private final JwtService jwtService;

    public AuthController(UserService userService, JwtService jwtService) {
        this.userService = userService;
        this.jwtService = jwtService;
    }

    @PostMapping({"/api/v1/login", "/auth", "/login"})
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        if (!userService.authenticate(request.getUserName(), request.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Sai tên đăng nhập hoặc mật khẩu"));
        }

        String token = jwtService.generateToken(request.getUserName());
        return ResponseEntity.ok(new LoginResponse("Đăng nhập thành công", token, request.getUserName()));
    }

    @GetMapping({"/api/v1/hello", "/hello"})
    public ResponseEntity<?> hello(HttpServletRequest request) {
        String userName = (String) request.getAttribute("jwtUser");
        if (userName == null) {
            String header = request.getHeader("Authorization");
            if (header != null && header.startsWith("Bearer ")) {
                String token = header.substring(7);
                if (jwtService.isTokenValid(token)) {
                    userName = jwtService.extractUserName(token);
                }
            }
        }

        if (userName == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Không có token hợp lệ hoặc token đã hết hạn"));
        }

        return ResponseEntity.ok(Map.of(
                "message", "Hello World",
                "userName", userName
        ));
    }
    @PostMapping({"/api/v1/register", "/register"})
    public ResponseEntity<?> register(@Valid @RequestBody LoginRequest request) {
        try {
            userService.register(request.getUserName(), request.getPassword());
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of("message", "Đăng ký tài khoản thành công!", "userName", request.getUserName()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }
}
