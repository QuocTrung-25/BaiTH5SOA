package com.example.soa.controller;

import com.example.soa.dto.OrderReportRequest;
import com.example.soa.model.OrderReport;
import com.example.soa.service.OrderReportService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/reports/orders")
public class OrderReportController {

    private final OrderReportService orderReportService;

    public OrderReportController(OrderReportService orderReportService) {
        this.orderReportService = orderReportService;
    }

    private String extractJwt(HttpServletRequest request) {
        String token = (String) request.getAttribute("jwtToken");
        if (token != null) return token;
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }

    @GetMapping
    public List<OrderReport> getAllOrderReports() {
        return orderReportService.getAllOrderReports();
    }

    @GetMapping("/{id}")
    public OrderReport getOrderReportById(@PathVariable Integer id) {
        return orderReportService.getOrderReportById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderReport createOrderReport(
            @Valid @RequestBody(required = false) OrderReportRequest bodyRequest,
            @RequestParam(name = "orderId", required = false) Integer queryOrderId,
            HttpServletRequest servletRequest) {

        OrderReportRequest request = bodyRequest != null ? bodyRequest : new OrderReportRequest();
        if (request.getOrderId() == null && queryOrderId != null) {
            request.setOrderId(queryOrderId);
        }

        String token = extractJwt(servletRequest);
        return orderReportService.createOrderReport(request, token);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteOrderReport(@PathVariable Integer id) {
        orderReportService.deleteOrderReport(id);
    }
}
