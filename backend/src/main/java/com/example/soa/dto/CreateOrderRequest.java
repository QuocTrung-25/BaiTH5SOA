package com.example.soa.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public class CreateOrderRequest {

    @NotBlank(message = "Tên khách hàng không được để trống")
    @JsonAlias({"customer_name", "customerName"})
    private String customerName;

    @NotBlank(message = "Email khách hàng không được để trống")
    @Email(message = "Email không hợp lệ")
    @JsonAlias({"customer_email", "customerEmail"})
    private String customerEmail;

    @NotEmpty(message = "Đơn hàng phải có ít nhất một mặt hàng")
    @Valid
    private List<OrderItemRequest> items;

    public CreateOrderRequest() {}

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }

    public List<OrderItemRequest> getItems() { return items; }
    public void setItems(List<OrderItemRequest> items) { this.items = items; }
}
