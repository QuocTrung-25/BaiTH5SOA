package com.example.soa.service;

import com.example.soa.dto.ProductReportRequest;
import com.example.soa.model.Product;
import com.example.soa.model.ProductReport;
import com.example.soa.repository.ProductReportRepository;
import com.example.soa.repository.ProductRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@Transactional
public class ProductReportService {

    private final ProductReportRepository productReportRepository;
    private final ProductRepository productRepository;

    public ProductReportService(ProductReportRepository productReportRepository, ProductRepository productRepository) {
        this.productReportRepository = productReportRepository;
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public List<ProductReport> getAllProductReports() {
        return productReportRepository.findAll();
    }

    @Transactional(readOnly = true)
    public ProductReport getProductReportById(Integer id) {
        return productReportRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy báo cáo sản phẩm với id: " + id));
    }

    public ProductReport createProductReport(ProductReportRequest request, String token) {
        Product product = productRepository.findById(request.getProductId())
                .orElse(null);

        String productName = request.getProductName();
        if (productName == null && product != null) {
            productName = product.getName();
        }

        BigDecimal revenue = request.getRevenue();
        if (revenue == null) {
            BigDecimal price = product != null ? product.getPrice() : BigDecimal.valueOf(100.0);
            revenue = price.multiply(BigDecimal.valueOf(request.getTotalSold())).setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal cost = request.getCost();
        if (cost == null) {
            cost = revenue.multiply(BigDecimal.valueOf(0.65)).setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal profit = request.getProfit() != null ? request.getProfit() : revenue.subtract(cost);

        ProductReport report = new ProductReport();
        report.setOrderReportId(request.getOrderReportId());
        report.setProductId(request.getProductId());
        report.setProductName(productName);
        report.setTotalSold(request.getTotalSold());
        report.setRevenue(revenue);
        report.setCost(cost);
        report.setProfit(profit);

        return productReportRepository.save(report);
    }

    public void deleteProductReport(Integer id) {
        ProductReport report = getProductReportById(id);
        productReportRepository.delete(report);
    }
}
