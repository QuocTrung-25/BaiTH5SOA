package com.example.soa.service;

import com.example.soa.dto.OrderReportRequest;
import com.example.soa.model.Order;
import com.example.soa.model.OrderReport;
import com.example.soa.repository.OrderReportRepository;
import com.example.soa.repository.OrderRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@Transactional
public class OrderReportService {

    private final OrderReportRepository orderReportRepository;
    private final OrderRepository orderRepository;

    public OrderReportService(OrderReportRepository orderReportRepository, OrderRepository orderRepository) {
        this.orderReportRepository = orderReportRepository;
        this.orderRepository = orderRepository;
    }

    @Transactional(readOnly = true)
    public List<OrderReport> getAllOrderReports() {
        return orderReportRepository.findAll();
    }

    @Transactional(readOnly = true)
    public OrderReport getOrderReportById(Integer id) {
        return orderReportRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy báo cáo đơn hàng với id: " + id));
    }

    public OrderReport createOrderReport(OrderReportRequest request, String token) {
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng với id: " + request.getOrderId()));

        BigDecimal revenue = request.getTotalRevenue() != null ? request.getTotalRevenue() : order.getTotalAmount();
        BigDecimal cost = request.getTotalCost() != null ? request.getTotalCost()
                : revenue.multiply(BigDecimal.valueOf(0.70)).setScale(2, RoundingMode.HALF_UP);
        BigDecimal profit = request.getTotalProfit() != null ? request.getTotalProfit() : revenue.subtract(cost);

        OrderReport report = new OrderReport();
        report.setOrderId(order.getId());
        report.setTotalRevenue(revenue);
        report.setTotalCost(cost);
        report.setTotalProfit(profit);

        return orderReportRepository.save(report);
    }

    public void deleteOrderReport(Integer id) {
        OrderReport report = getOrderReportById(id);
        orderReportRepository.delete(report);
    }
}
