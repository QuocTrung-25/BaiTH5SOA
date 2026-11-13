package com.example.orderservice.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Pattern;

public record UpdateOrderStatusRequest(
        @Pattern(regexp = "^(?i)(pending|completed|cancelled)$", message = "Trạng thái đơn hàng phải là: pending, completed hoặc cancelled")
        @JsonProperty("status")
        String status,

        @JsonProperty("customer_name")
        @JsonAlias({"customerName", "customer_name"})
        String customerName,

        @JsonProperty("customer_email")
        @JsonAlias({"customerEmail", "customer_email"})
        String customerEmail
) {
}
