package com.example.orderservice.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record CreateOrderRequest(
        @NotBlank(message = "Tên khách hàng không được để trống")
        @JsonProperty("customer_name")
        @JsonAlias({"customerName", "customer_name"})
        String customerName,

        @NotBlank(message = "Email khách hàng không được để trống")
        @Email(message = "Email không hợp lệ")
        @JsonProperty("customer_email")
        @JsonAlias({"customerEmail", "customer_email"})
        String customerEmail,

        @JsonProperty("status")
        String status,

        @Valid
        @JsonProperty("items")
        List<OrderItemRequest> items
) {
}
