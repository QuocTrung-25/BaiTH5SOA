package com.example.soa.dto;

public class LoginResponse {
    private String message;
    private String token;
    private String userName;

    public LoginResponse() {}

    public LoginResponse(String message, String token, String userName) {
        this.message = message;
        this.token = token;
        this.userName = userName;
    }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }
}
