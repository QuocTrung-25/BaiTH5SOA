package com.example.soa.service;

import com.example.soa.dto.CreateOrderItemRequest;
import com.example.soa.dto.UpdateOrderItemRequest;
import com.example.soa.model.Order;
import com.example.soa.model.OrderItem;
import com.example.soa.model.Product;
import com.example.soa.repository.OrderItemRepository;
import com.example.soa.repository.OrderRepository;
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
    private final ProductService productService;

    public OrderItemService(OrderItemRepository orderItemRepository,
                            OrderRepository orderRepository,
                            ProductService productService) {
        this.orderItemRepository = orderItemRepository;
        this.orderRepository = orderRepository;
        this.productService = productService;
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
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy mặt hàng với id: " + id));
    }

    public OrderItem createItem(CreateOrderItemRequest request, String token) {
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng với id: " + request.getOrderId()));

        // Check & decrement stock
        Product product = productService.checkAndDecrementStock(request.getProductId(), request.getQuantity());

        OrderItem item = new OrderItem();
        item.setOrder(order);
        item.setProductId(product.getId());
        item.setProductName(request.getProductName() != null && !request.getProductName().isBlank()
                ? request.getProductName() : product.getName());
        item.setQuantity(request.getQuantity());

        BigDecimal unitPrice = request.getUnitPrice() != null ? request.getUnitPrice() : product.getPrice();
        item.setUnitPrice(unitPrice);
        item.setTotalPrice(unitPrice.multiply(BigDecimal.valueOf(request.getQuantity())));

        OrderItem saved = orderItemRepository.save(item);

        // Recalculate order total
        recalculateOrderTotal(order);

        return saved;
    }

    public OrderItem updateItem(Integer id, UpdateOrderItemRequest request, String token) {
        OrderItem item = getItemById(id);

        if (request.getQuantity() != null) {
            item.setQuantity(request.getQuantity());
        }
        if (request.getUnitPrice() != null) {
            item.setUnitPrice(request.getUnitPrice());
        }

        item.setTotalPrice(item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
        OrderItem saved = orderItemRepository.save(item);

        if (item.getOrder() != null) {
            recalculateOrderTotal(item.getOrder());
        }

        return saved;
    }

    public void deleteItem(Integer id, String token) {
        OrderItem item = getItemById(id);
        Order order = item.getOrder();
        orderItemRepository.delete(item);

        if (order != null) {
            recalculateOrderTotal(order);
        }
    }

    private void recalculateOrderTotal(Order order) {
        List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
        BigDecimal total = BigDecimal.ZERO;
        for (OrderItem it : items) {
            total = total.add(it.getTotalPrice());
        }
        order.setTotalAmount(total);
        orderRepository.save(order);
    }
}
