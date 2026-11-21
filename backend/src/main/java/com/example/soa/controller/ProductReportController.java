package com.example.soa.controller;

import com.example.soa.dto.ProductReportRequest;
import com.example.soa.model.ProductReport;
import com.example.soa.service.ProductReportService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/reports/products")
public class ProductReportController {

    private final ProductReportService productReportService;

    public ProductReportController(ProductReportService productReportService) {
        this.productReportService = productReportService;
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
    public List<ProductReport> getAllProductReports() {
        return productReportService.getAllProductReports();
    }

    @GetMapping("/{id}")
    public ProductReport getProductReportById(@PathVariable Integer id) {
        return productReportService.getProductReportById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductReport createProductReport(
            @Valid @RequestBody(required = false) ProductReportRequest bodyRequest,
            @RequestParam(name = "orderReportId", required = false) Integer queryOrderReportId,
            @RequestParam(name = "productId", required = false) Integer queryProductId,
            @RequestParam(name = "totalSold", required = false) Integer queryTotalSold,
            HttpServletRequest servletRequest) {

        ProductReportRequest request = bodyRequest != null ? bodyRequest : new ProductReportRequest();
        if (request.getOrderReportId() == null && queryOrderReportId != null) {
            request.setOrderReportId(queryOrderReportId);
        }
        if (request.getProductId() == null && queryProductId != null) {
            request.setProductId(queryProductId);
        }
        if (request.getTotalSold() == null && queryTotalSold != null) {
            request.setTotalSold(queryTotalSold);
        }

        String token = extractJwt(servletRequest);
        return productReportService.createProductReport(request, token);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteProductReport(@PathVariable Integer id) {
        productReportService.deleteProductReport(id);
    }
}
