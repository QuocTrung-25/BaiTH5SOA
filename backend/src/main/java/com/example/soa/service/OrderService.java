package com.example.soa.service;

import com.example.soa.dto.CreateOrderRequest;
import com.example.soa.dto.OrderItemRequest;
import com.example.soa.dto.UpdateOrderStatusRequest;
import com.example.soa.model.Order;
import com.example.soa.model.OrderItem;
import com.example.soa.model.Product;
import com.example.soa.repository.OrderRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@Service
@Transactional
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductService productService;

    public OrderService(OrderRepository orderRepository, ProductService productService) {
        this.orderRepository = orderRepository;
        this.productService = productService;
    }

    @Transactional(readOnly = true)
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Order getOrderById(Integer id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng với id: " + id));
    }

    public Order createOrder(CreateOrderRequest request, String token) {
        Order order = new Order();
        order.setCustomerName(request.getCustomerName());
        order.setCustomerEmail(request.getCustomerEmail());
        order.setStatus("pending");

        BigDecimal totalAmount = BigDecimal.ZERO;

        for (OrderItemRequest itemReq : request.getItems()) {
            // Check & decrement product stock
            Product product = productService.checkAndDecrementStock(itemReq.getProductId(), itemReq.getQuantity());

            OrderItem item = new OrderItem();
            item.setProductId(product.getId());
            item.setProductName(product.getName());
            item.setQuantity(itemReq.getQuantity());
            item.setUnitPrice(product.getPrice());

            BigDecimal lineTotal = product.getPrice().multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            item.setTotalPrice(lineTotal);

            order.addItem(item);
            totalAmount = totalAmount.add(lineTotal);
        }

        order.setTotalAmount(totalAmount);
        return orderRepository.save(order);
    }

    public Order updateOrderStatus(Integer id, UpdateOrderStatusRequest request, String token) {
        Order order = getOrderById(id);
        order.setStatus(request.getStatus().toLowerCase());
        return orderRepository.save(order);
    }

    public void deleteOrder(Integer id, String token) {
        Order order = getOrderById(id);
        orderRepository.delete(order);
    }
}
