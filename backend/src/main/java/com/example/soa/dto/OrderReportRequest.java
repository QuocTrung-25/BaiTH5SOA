package com.example.soa.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class OrderReportRequest {

    @NotNull(message = "Mã đơn hàng không được để trống")
    @JsonAlias({"order_id", "orderId"})
    private Integer orderId;

    @JsonAlias({"total_revenue", "totalRevenue"})
    private BigDecimal totalRevenue;

    @JsonAlias({"total_cost", "totalCost"})
    private BigDecimal totalCost;

    @JsonAlias({"total_profit", "totalProfit"})
    private BigDecimal totalProfit;

    public OrderReportRequest() {}

    public OrderReportRequest(Integer orderId) {
        this.orderId = orderId;
    }

    public Integer getOrderId() { return orderId; }
    public void setOrderId(Integer orderId) { this.orderId = orderId; }

    public BigDecimal getTotalRevenue() { return totalRevenue; }
    public void setTotalRevenue(BigDecimal totalRevenue) { this.totalRevenue = totalRevenue; }

    public BigDecimal getTotalCost() { return totalCost; }
    public void setTotalCost(BigDecimal totalCost) { this.totalCost = totalCost; }

    public BigDecimal getTotalProfit() { return totalProfit; }
    public void setTotalProfit(BigDecimal totalProfit) { this.totalProfit = totalProfit; }
}
