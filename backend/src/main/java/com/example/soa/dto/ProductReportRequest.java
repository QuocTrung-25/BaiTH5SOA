package com.example.soa.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class ProductReportRequest {

    @JsonAlias({"order_report_id", "orderReportId"})
    private Integer orderReportId;

    @NotNull(message = "Mã sản phẩm không được để trống")
    @JsonAlias({"product_id", "productId"})
    private Integer productId;

    @JsonAlias({"product_name", "productName"})
    private String productName;

    @NotNull(message = "Số lượng bán không được để trống")
    @Min(value = 1, message = "Số lượng bán phải lớn hơn 0")
    @JsonAlias({"total_sold", "totalSold"})
    private Integer totalSold;

    private BigDecimal revenue;
    private BigDecimal cost;
    private BigDecimal profit;

    public ProductReportRequest() {}

    public Integer getOrderReportId() { return orderReportId; }
    public void setOrderReportId(Integer orderReportId) { this.orderReportId = orderReportId; }

    public Integer getProductId() { return productId; }
    public void setProductId(Integer productId) { this.productId = productId; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public Integer getTotalSold() { return totalSold; }
    public void setTotalSold(Integer totalSold) { this.totalSold = totalSold; }

    public BigDecimal getRevenue() { return revenue; }
    public void setRevenue(BigDecimal revenue) { this.revenue = revenue; }

    public BigDecimal getCost() { return cost; }
    public void setCost(BigDecimal cost) { this.cost = cost; }

    public BigDecimal getProfit() { return profit; }
    public void setProfit(BigDecimal profit) { this.profit = profit; }
}
