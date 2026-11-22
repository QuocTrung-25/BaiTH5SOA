package com.example.soa.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.soa.dto.OrderReportRequest;
import com.example.soa.model.Order;
import com.example.soa.model.OrderItem;
import com.example.soa.model.OrderReport;
import com.example.soa.model.ProductReport;
import com.example.soa.repository.OrderReportRepository;
import com.example.soa.repository.OrderRepository;
import com.example.soa.repository.ProductReportRepository;

@Service
@Transactional
public class OrderReportService {

    private final OrderReportRepository orderReportRepository;
    private final OrderRepository orderRepository;
    private final ProductReportRepository productReportRepository;

    public OrderReportService(OrderReportRepository orderReportRepository,
                              OrderRepository orderRepository,
                              ProductReportRepository productReportRepository) {
        this.orderReportRepository = orderReportRepository;
        this.orderRepository = orderRepository;
        this.productReportRepository = productReportRepository;
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
        if (request.getOrderId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã đơn hàng (orderId) không được để trống");
        }

        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng với id: " + request.getOrderId()));

        BigDecimal revenue = request.getTotalRevenue() != null ? request.getTotalRevenue() : order.getTotalAmount();
        BigDecimal cost = request.getTotalCost() != null ? request.getTotalCost()
                : revenue.multiply(BigDecimal.valueOf(0.70)).setScale(2, RoundingMode.HALF_UP);
        BigDecimal profit = request.getTotalProfit() != null ? request.getTotalProfit() : revenue.subtract(cost);

        // Nếu đơn hàng đã có báo cáo thì cập nhật lại thay vì lỗi trùng khóa UNIQUE
        OrderReport report = orderReportRepository.findByOrderId(order.getId()).orElseGet(OrderReport::new);
        report.setOrderId(order.getId());
        report.setTotalRevenue(revenue);
        report.setTotalCost(cost);
        report.setTotalProfit(profit);

        OrderReport savedReport = orderReportRepository.save(report);

        // Đồng bộ chi tiết sang product_reports
        List<ProductReport> oldItems = productReportRepository.findByOrderReportId(savedReport.getId());
        if (!oldItems.isEmpty()) {
            productReportRepository.deleteAll(oldItems);
        }
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                BigDecimal itemRev = item.getTotalPrice();
                BigDecimal itemCost = itemRev.multiply(BigDecimal.valueOf(0.70)).setScale(2, RoundingMode.HALF_UP);
                BigDecimal itemProfit = itemRev.subtract(itemCost);

                ProductReport pr = new ProductReport();
                pr.setOrderReportId(savedReport.getId());
                pr.setProductId(item.getProductId());
                pr.setProductName(item.getProductName());
                pr.setTotalSold(item.getQuantity());
                pr.setRevenue(itemRev);
                pr.setCost(itemCost);
                pr.setProfit(itemProfit);
                productReportRepository.save(pr);
            }
        }

        return savedReport;
    }

    public void deleteOrderReport(Integer id) {
        OrderReport report = getOrderReportById(id);
        List<ProductReport> items = productReportRepository.findByOrderReportId(id);
        if (!items.isEmpty()) {
            productReportRepository.deleteAll(items);
        }
        orderReportRepository.delete(report);
    }
}