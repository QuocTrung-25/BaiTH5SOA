package com.example.orderservice.service;

import com.example.orderservice.dto.CreateOrderRequest;
import com.example.orderservice.dto.OrderItemRequest;
import com.example.orderservice.dto.ProductDto;
import com.example.orderservice.dto.UpdateOrderStatusRequest;
import com.example.orderservice.model.Order;
import com.example.orderservice.model.OrderItem;
import com.example.orderservice.repository.OrderRepository;
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
    private final ProductServiceClient productServiceClient;

    public OrderService(OrderRepository orderRepository, ProductServiceClient productServiceClient) {
        this.orderRepository = orderRepository;
        this.productServiceClient = productServiceClient;
    }

    @Transactional(readOnly = true)
    public List<Order> getAllOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public Order getOrderById(Integer id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng với ID: " + id));
    }

    public Order createOrder(CreateOrderRequest request, String jwtToken) {
        String status = (request.status() != null && !request.status().isBlank())
                ? request.status().toLowerCase()
                : "pending";

        Order order = new Order(request.customerName(), request.customerEmail(), status, BigDecimal.ZERO);
        BigDecimal totalAmount = BigDecimal.ZERO;

        if (request.items() != null && !request.items().isEmpty()) {
            for (OrderItemRequest itemReq : request.items()) {
                ProductDto product = productServiceClient.checkStock(itemReq.productId(), itemReq.quantity(), jwtToken);

                BigDecimal unitPrice = product.getPrice();
                BigDecimal totalPrice = unitPrice.multiply(BigDecimal.valueOf(itemReq.quantity()));

                OrderItem item = new OrderItem(
                        order,
                        product.getId(),
                        product.getName(),
                        itemReq.quantity(),
                        unitPrice,
                        totalPrice
                );
                order.addItem(item);
                totalAmount = totalAmount.add(totalPrice);
            }
        }

        order.setTotalAmount(totalAmount);
        Order savedOrder = orderRepository.save(order);

        if (request.items() != null && !request.items().isEmpty()) {
            for (OrderItemRequest itemReq : request.items()) {
                productServiceClient.deductStock(itemReq.productId(), itemReq.quantity(), jwtToken);
            }
        }

        return savedOrder;
    }

    public Order updateOrderStatus(Integer id, UpdateOrderStatusRequest request, String jwtToken) {
        Order order = getOrderById(id);

        if (request.customerName() != null && !request.customerName().isBlank()) {
            order.setCustomerName(request.customerName());
        }
        if (request.customerEmail() != null && !request.customerEmail().isBlank()) {
            order.setCustomerEmail(request.customerEmail());
        }

        if (request.status() != null && !request.status().isBlank()) {
            String newStatus = request.status().toLowerCase();
            String oldStatus = order.getStatus();

            if (!"cancelled".equalsIgnoreCase(oldStatus) && "cancelled".equalsIgnoreCase(newStatus)) {
                for (OrderItem item : order.getItems()) {
                    productServiceClient.restoreStock(item.getProductId(), item.getQuantity(), jwtToken);
                }
            }

            order.setStatus(newStatus);
        }

        return orderRepository.save(order);
    }

    public void deleteOrder(Integer id, String jwtToken) {
        Order order = getOrderById(id);

        if (!"cancelled".equalsIgnoreCase(order.getStatus())) {
            for (OrderItem item : order.getItems()) {
                productServiceClient.restoreStock(item.getProductId(), item.getQuantity(), jwtToken);
            }
        }

        orderRepository.delete(order);
    }
}
