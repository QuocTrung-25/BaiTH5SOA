package com.example.orderservice.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Min;

import java.math.BigDecimal;

public record UpdateOrderItemRequest(
        @Min(value = 1, message = "Số lượng phải lớn hơn 0")
        @JsonProperty("quantity")
        Integer quantity,

        @JsonProperty("product_id")
        @JsonAlias({"productId", "product_id"})
        Integer productId,

        @JsonProperty("unit_price")
        @JsonAlias({"unitPrice", "unit_price"})
        BigDecimal unitPrice
) {
}
