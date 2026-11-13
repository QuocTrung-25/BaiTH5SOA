package com.example.orderservice.service;

import com.example.orderservice.dto.CreateOrderItemRequest;
import com.example.orderservice.dto.ProductDto;
import com.example.orderservice.dto.UpdateOrderItemRequest;
import com.example.orderservice.model.Order;
import com.example.orderservice.model.OrderItem;
import com.example.orderservice.repository.OrderItemRepository;
import com.example.orderservice.repository.OrderRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@Service
@Transactional
public class OrderItemService {

    private final OrderItemRepository orderItemRepository;
    private final OrderRepository orderRepository;
    private final ProductServiceClient productServiceClient;

    public OrderItemService(
            OrderItemRepository orderItemRepository,
            OrderRepository orderRepository,
            ProductServiceClient productServiceClient) {
        this.orderItemRepository = orderItemRepository;
        this.orderRepository = orderRepository;
        this.productServiceClient = productServiceClient;
    }

    @Transactional(readOnly = true)
    public List<OrderItem> getAllItems(Integer orderId) {
        if (orderId != null) {
            return orderItemRepository.findByOrderId(orderId);
        }
        return orderItemRepository.findAll();
    }

    @Transactional(readOnly = true)
    public OrderItem getItemById(Integer id) {
        return orderItemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy chi tiết mặt hàng với ID: " + id));
    }

    public OrderItem createItem(CreateOrderItemRequest request, String jwtToken) {
        Order order = orderRepository.findById(request.orderId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng với ID: " + request.orderId()));

        ProductDto product = productServiceClient.checkStock(request.productId(), request.quantity(), jwtToken);

        String productName = (request.productName() != null && !request.productName().isBlank())
                ? request.productName()
                : product.getName();

        BigDecimal unitPrice = request.unitPrice() != null ? request.unitPrice() : product.getPrice();
        BigDecimal totalPrice = unitPrice.multiply(BigDecimal.valueOf(request.quantity()));

        OrderItem item = new OrderItem(order, request.productId(), productName, request.quantity(), unitPrice, totalPrice);
        OrderItem savedItem = orderItemRepository.save(item);

        productServiceClient.deductStock(request.productId(), request.quantity(), jwtToken);

        order.addItem(savedItem);
        order.recalculateTotalAmount();
        orderRepository.save(order);

        return savedItem;
    }

    public OrderItem updateItem(Integer id, UpdateOrderItemRequest request, String jwtToken) {
        OrderItem item = getItemById(id);
        Order order = item.getOrder();

        if (request.quantity() != null && !request.quantity().equals(item.getQuantity())) {
            int oldQty = item.getQuantity();
            int newQty = request.quantity();

            if (newQty > oldQty) {
                int delta = newQty - oldQty;
                productServiceClient.checkStock(item.getProductId(), delta, jwtToken);
                productServiceClient.deductStock(item.getProductId(), delta, jwtToken);
            } else {
                int delta = oldQty - newQty;
                productServiceClient.restoreStock(item.getProductId(), delta, jwtToken);
            }

            item.setQuantity(newQty);
        }

        if (request.unitPrice() != null) {
            item.setUnitPrice(request.unitPrice());
        }

        item.setTotalPrice(item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
        OrderItem updatedItem = orderItemRepository.save(item);

        if (order != null) {
            order.recalculateTotalAmount();
            orderRepository.save(order);
        }

        return updatedItem;
    }

    public void deleteItem(Integer id, String jwtToken) {
        OrderItem item = getItemById(id);
        Order order = item.getOrder();

        if (order != null && !"cancelled".equalsIgnoreCase(order.getStatus())) {
            productServiceClient.restoreStock(item.getProductId(), item.getQuantity(), jwtToken);
        }

        if (order != null) {
            order.removeItem(item);
            order.recalculateTotalAmount();
            orderRepository.save(order);
        }

        orderItemRepository.delete(item);
    }
}
