package com.example.soa.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import java.math.BigDecimal;

public class UpdateOrderItemRequest {

    @Min(value = 1, message = "Số lượng phải lớn hơn 0")
    private Integer quantity;

    @DecimalMin(value = "0.0", inclusive = true, message = "Đơn giá không được âm")
    @JsonAlias({"unit_price", "unitPrice"})
    private BigDecimal unitPrice;

    public UpdateOrderItemRequest() {}

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }
}
