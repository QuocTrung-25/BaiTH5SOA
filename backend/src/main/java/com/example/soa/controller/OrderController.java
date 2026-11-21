package com.example.soa.controller;

import com.example.soa.dto.CreateOrderRequest;
import com.example.soa.dto.UpdateOrderStatusRequest;
import com.example.soa.model.Order;
import com.example.soa.service.OrderService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
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
    public List<Order> getAllOrders() {
        return orderService.getAllOrders();
    }

    @GetMapping("/{id}")
    public Order getOrderById(@PathVariable Integer id) {
        return orderService.getOrderById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Order createOrder(@Valid @RequestBody CreateOrderRequest request, HttpServletRequest servletRequest) {
        String token = extractJwt(servletRequest);
        return orderService.createOrder(request, token);
    }

    @PutMapping("/{id}")
    public Order updateOrderStatus(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateOrderStatusRequest request,
            HttpServletRequest servletRequest) {
        String token = extractJwt(servletRequest);
        return orderService.updateOrderStatus(id, request, token);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteOrder(@PathVariable Integer id, HttpServletRequest servletRequest) {
        String token = extractJwt(servletRequest);
        orderService.deleteOrder(id, token);
    }
}
