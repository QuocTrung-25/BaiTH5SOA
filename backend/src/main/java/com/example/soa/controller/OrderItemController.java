package com.example.soa.controller;

import com.example.soa.dto.CreateOrderItemRequest;
import com.example.soa.dto.UpdateOrderItemRequest;
import com.example.soa.model.OrderItem;
import com.example.soa.service.OrderItemService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/order_items")
public class OrderItemController {

    private final OrderItemService orderItemService;

    public OrderItemController(OrderItemService orderItemService) {
        this.orderItemService = orderItemService;
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
    public List<OrderItem> getAllOrderItems(
            @RequestParam(name = "order_id", required = false) Integer orderIdSnake,
            @RequestParam(name = "orderId", required = false) Integer orderIdCamel) {
        Integer orderId = orderIdSnake != null ? orderIdSnake : orderIdCamel;
        return orderItemService.getAllItems(orderId);
    }

    @GetMapping("/{id}")
    public OrderItem getOrderItemById(@PathVariable Integer id) {
        return orderItemService.getItemById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderItem createOrderItem(
            @Valid @RequestBody CreateOrderItemRequest request,
            HttpServletRequest servletRequest) {
        String token = extractJwt(servletRequest);
        return orderItemService.createItem(request, token);
    }

    @PutMapping("/{id}")
    public OrderItem updateOrderItem(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateOrderItemRequest request,
            HttpServletRequest servletRequest) {
        String token = extractJwt(servletRequest);
        return orderItemService.updateItem(id, request, token);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteOrderItem(@PathVariable Integer id, HttpServletRequest servletRequest) {
        String token = extractJwt(servletRequest);
        orderItemService.deleteItem(id, token);
    }
}
