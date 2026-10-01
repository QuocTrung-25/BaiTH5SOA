package com.example.jwtapi.filter;

import com.example.jwtapi.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();

        // /auth là API đăng nhập nên không cần JWT.
        if (path.equals("/auth")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Chỉ bảo vệ /hello trong bài lab này.
        if (path.equals("/hello")) {
            String authHeader = request.getHeader("Authorization");

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write(
                        "{\"message\":\"Missing or invalid Authorization header\"}");
                return;
            }

            String token = authHeader.substring(7);

            if (!jwtService.isTokenValid(token)) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write(
                        "{\"message\":\"Invalid or expired JWT token\"}");
                return;
            }

            request.setAttribute("userName", jwtService.extractUserName(token));
        }

        filterChain.doFilter(request, response);
    }
}
