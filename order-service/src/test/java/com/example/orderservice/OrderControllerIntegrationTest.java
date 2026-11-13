package com.example.orderservice;

import com.example.orderservice.dto.ProductDto;
import com.example.orderservice.service.ProductServiceClient;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.SecretKey;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Date;

import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:order-test;DB_CLOSE_DELAY=-1")
@AutoConfigureMockMvc
class OrderControllerIntegrationTest {

    private static final String JWT_SECRET = "ThisIsASecretKeyForJwtLab2026VeryLong123456789";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ProductServiceClient productServiceClient;

    private String validToken;

    @BeforeEach
    void setUp() {
        SecretKey key = Keys.hmacShaKeyFor(JWT_SECRET.getBytes(StandardCharsets.UTF_8));
        Date now = new Date();
        validToken = Jwts.builder()
                .subject("admin")
                .issuedAt(now)
                .expiration(new Date(now.getTime() + 60_000))
                .signWith(key)
                .compact();
    }

    @Test
    void unauthenticatedRequestsShouldReturn401() throws Exception {
        mockMvc.perform(get("/orders"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/order_items"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"customer_name\":\"Test\",\"customer_email\":\"test@test.com\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testOrderLifecycleWithStockCheckAndCrud() throws Exception {
        ProductDto mockProduct = new ProductDto(1, "Ban phim co", "Ban phim co RGB", new BigDecimal("150000.00"), 50);
        when(productServiceClient.checkStock(anyInt(), anyInt(), anyString())).thenReturn(mockProduct);
        doNothing().when(productServiceClient).deductStock(anyInt(), anyInt(), anyString());
        doNothing().when(productServiceClient).restoreStock(anyInt(), anyInt(), anyString());

        String createPayload = """
                {
                  "customer_name": "Nguyen Van A",
                  "customer_email": "nguyenvana@gmail.com",
                  "items": [
                    {
                      "product_id": 1,
                      "quantity": 2
                    }
                  ]
                }
                """;

        MvcResult createResult = mockMvc.perform(post("/orders")
                        .header("Authorization", "Bearer " + validToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.customer_name").value("Nguyen Van A"))
                .andExpect(jsonPath("$.status").value("pending"))
                .andExpect(jsonPath("$.total_amount").value(300000.00))
                .andExpect(jsonPath("$.items").isArray())
                .andExpect(jsonPath("$.items[0].product_name").value("Ban phim co"))
                .andReturn();

        JsonNode responseNode = objectMapper.readTree(createResult.getResponse().getContentAsString());
        int orderId = responseNode.get("id").asInt();

        mockMvc.perform(get("/orders/" + orderId)
                        .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(orderId))
                .andExpect(jsonPath("$.customer_name").value("Nguyen Van A"));

        mockMvc.perform(get("/orders")
                        .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        String updatePayload = """
                {
                  "status": "completed"
                }
                """;
        mockMvc.perform(put("/orders/" + orderId)
                        .header("Authorization", "Bearer " + validToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updatePayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("completed"));

        mockMvc.perform(delete("/orders/" + orderId)
                        .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/orders/" + orderId)
                        .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void testInsufficientStockReturns400() throws Exception {
        when(productServiceClient.checkStock(anyInt(), anyInt(), anyString()))
                .thenThrow(new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sản phẩm không đủ số lượng tồn kho. Hiện có: 2, Yêu cầu: 10"));

        String createPayload = """
                {
                  "customer_name": "Nguyen Van B",
                  "customer_email": "nguyenvanb@gmail.com",
                  "items": [
                    {
                      "product_id": 99,
                      "quantity": 10
                    }
                  ]
                }
                """;

        mockMvc.perform(post("/orders")
                        .header("Authorization", "Bearer " + validToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createPayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Sản phẩm không đủ số lượng tồn kho. Hiện có: 2, Yêu cầu: 10"));
    }

    @Test
    void testOrderItemsCrudAndRecalculateTotal() throws Exception {
        ProductDto mockProduct = new ProductDto(2, "Chuot Gaming", "Chuot quang khong day", new BigDecimal("250000.00"), 30);
        when(productServiceClient.checkStock(anyInt(), anyInt(), anyString())).thenReturn(mockProduct);
        doNothing().when(productServiceClient).deductStock(anyInt(), anyInt(), anyString());
        doNothing().when(productServiceClient).restoreStock(anyInt(), anyInt(), anyString());

        String orderPayload = """
                {
                  "customer_name": "Tran Thi C",
                  "customer_email": "tranthic@gmail.com"
                }
                """;

        MvcResult orderResult = mockMvc.perform(post("/orders")
                        .header("Authorization", "Bearer " + validToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(orderPayload))
                .andExpect(status().isCreated())
                .andReturn();

        int orderId = objectMapper.readTree(orderResult.getResponse().getContentAsString()).get("id").asInt();

        String itemPayload = String.format("""
                {
                  "order_id": %d,
                  "product_id": 2,
                  "quantity": 3
                }
                """, orderId);

        MvcResult itemResult = mockMvc.perform(post("/order_items")
                        .header("Authorization", "Bearer " + validToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(itemPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.product_name").value("Chuot Gaming"))
                .andExpect(jsonPath("$.quantity").value(3))
                .andExpect(jsonPath("$.unit_price").value(250000.00))
                .andExpect(jsonPath("$.total_price").value(750000.00))
                .andReturn();

        int itemId = objectMapper.readTree(itemResult.getResponse().getContentAsString()).get("id").asInt();

        mockMvc.perform(get("/orders/" + orderId)
                        .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total_amount").value(750000.00));

        mockMvc.perform(get("/order_items/" + itemId)
                        .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(itemId));

        String updateItemPayload = """
                {
                  "quantity": 1
                }
                """;
        mockMvc.perform(put("/order_items/" + itemId)
                        .header("Authorization", "Bearer " + validToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateItemPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quantity").value(1))
                .andExpect(jsonPath("$.total_price").value(250000.00));

        mockMvc.perform(get("/orders/" + orderId)
                        .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total_amount").value(250000.00));

        mockMvc.perform(delete("/order_items/" + itemId)
                        .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/orders/" + orderId)
                        .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total_amount").value(0.00));
    }
}
