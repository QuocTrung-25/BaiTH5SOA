package com.example.orderservice.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record OrderItemRequest(
        @NotNull(message = "Mã sản phẩm không được để trống")
        @JsonProperty("product_id")
        @JsonAlias({"productId", "product_id"})
        Integer productId,

        @NotNull(message = "Số lượng không được để trống")
        @Min(value = 1, message = "Số lượng phải lớn hơn 0")
        @JsonProperty("quantity")
        Integer quantity
) {
}
