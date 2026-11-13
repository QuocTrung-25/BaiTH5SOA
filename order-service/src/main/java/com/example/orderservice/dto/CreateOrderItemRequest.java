package com.example.orderservice.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record CreateOrderItemRequest(
        @NotNull(message = "Mã đơn hàng không được để trống")
        @JsonProperty("order_id")
        @JsonAlias({"orderId", "order_id"})
        Integer orderId,

        @NotNull(message = "Mã sản phẩm không được để trống")
        @JsonProperty("product_id")
        @JsonAlias({"productId", "product_id"})
        Integer productId,

        @NotNull(message = "Số lượng không được để trống")
        @Min(value = 1, message = "Số lượng phải lớn hơn 0")
        @JsonProperty("quantity")
        Integer quantity,

        @JsonProperty("unit_price")
        @JsonAlias({"unitPrice", "unit_price"})
        BigDecimal unitPrice,

        @JsonProperty("product_name")
        @JsonAlias({"productName", "product_name"})
        String productName
) {
}
