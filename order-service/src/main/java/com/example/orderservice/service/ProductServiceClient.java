package com.example.orderservice.service;

import com.example.orderservice.dto.ProductDto;
import com.example.orderservice.security.OrderJwtAuthenticationFilter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;

@Service
public class ProductServiceClient {

    private static final Logger log = LoggerFactory.getLogger(ProductServiceClient.class);

    private final RestClient restClient = RestClient.create();
    private final String productServiceUrl;
    private final OrderJwtAuthenticationFilter jwtFilter;

    public ProductServiceClient(
            @Value("${services.product-service.url:http://localhost:8081}") String productServiceUrl,
            OrderJwtAuthenticationFilter jwtFilter) {
        this.productServiceUrl = productServiceUrl.endsWith("/")
                ? productServiceUrl.substring(0, productServiceUrl.length() - 1)
                : productServiceUrl;
        this.jwtFilter = jwtFilter;
    }

    private String resolveToken(String jwtToken) {
        if (jwtToken != null && !jwtToken.isBlank()) {
            return jwtToken.startsWith("Bearer ") ? jwtToken : "Bearer " + jwtToken;
        }
        return "Bearer " + jwtFilter.generateInternalToken("order-service-client");
    }

    public ProductDto getProductById(Integer productId, String jwtToken) {
        String url = productServiceUrl + "/products/" + productId;
        String authHeader = resolveToken(jwtToken);

        try {
            return restClient.get()
                    .uri(url)
                    .header("Authorization", authHeader)
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .onStatus(status -> status.value() == 404, (req, res) -> {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                "Sản phẩm với ID " + productId + " không tồn tại trong Product Service.");
                    })
                    .onStatus(HttpStatusCode::isError, (req, res) -> {
                        throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                                "Lỗi khi gọi Product Service (Mã lỗi: " + res.getStatusCode() + ")");
                    })
                    .body(ProductDto.class);
        } catch (HttpClientErrorException.NotFound e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Sản phẩm với ID " + productId + " không tồn tại trong Product Service.");
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to query product {} from {}: {}", productId, url, e.getMessage());
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Không thể kết nối Product Service tại " + url + ": " + e.getMessage());
        }
    }

    public ProductDto checkStock(Integer productId, Integer requiredQuantity, String jwtToken) {
        ProductDto product = getProductById(productId, jwtToken);
        if (product == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Không tìm thấy thông tin sản phẩm với ID: " + productId);
        }
        int currentStock = product.getQuantity() != null ? product.getQuantity() : 0;
        if (currentStock < requiredQuantity) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, String.format(
                    "Sản phẩm '%s' (ID: %d) không đủ số lượng tồn kho. Hiện có: %d, Yêu cầu: %d",
                    product.getName(), productId, currentStock, requiredQuantity));
        }
        return product;
    }

    public void deductStock(Integer productId, Integer deductQuantity, String jwtToken) {
        if (deductQuantity == null || deductQuantity <= 0) {
            return;
        }
        try {
            ProductDto product = getProductById(productId, jwtToken);
            int newQuantity = product.getQuantity() - deductQuantity;
            if (newQuantity < 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, String.format(
                        "Không thể trừ kho cho sản phẩm '%s'. Tồn kho %d không đủ để trừ %d.",
                        product.getName(), product.getQuantity(), deductQuantity));
            }
            updateProductStock(product, newQuantity, jwtToken);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Could not deduct stock in Product Service for product {}: {}", productId, e.getMessage());
        }
    }

    public void restoreStock(Integer productId, Integer restoreQuantity, String jwtToken) {
        if (restoreQuantity == null || restoreQuantity <= 0) {
            return;
        }
        try {
            ProductDto product = getProductById(productId, jwtToken);
            int newQuantity = product.getQuantity() + restoreQuantity;
            updateProductStock(product, newQuantity, jwtToken);
        } catch (Exception e) {
            log.warn("Could not restore stock in Product Service for product {}: {}", productId, e.getMessage());
        }
    }

    private void updateProductStock(ProductDto product, int newQuantity, String jwtToken) {
        String url = productServiceUrl + "/products/" + product.getId();
        String authHeader = resolveToken(jwtToken);

        Map<String, Object> updatePayload = new HashMap<>();
        updatePayload.put("name", product.getName());
        updatePayload.put("description", product.getDescription());
        updatePayload.put("price", product.getPrice());
        updatePayload.put("quantity", newQuantity);

        restClient.put()
                .uri(url)
                .header("Authorization", authHeader)
                .contentType(MediaType.APPLICATION_JSON)
                .body(updatePayload)
                .retrieve()
                .toBodilessEntity();
    }
}
