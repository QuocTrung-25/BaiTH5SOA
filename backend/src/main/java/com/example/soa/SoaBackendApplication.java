package com.example.soa;

import com.example.soa.model.*;
import com.example.soa.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.math.BigDecimal;

@SpringBootApplication
public class SoaBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(SoaBackendApplication.class, args);
    }

    @Bean
    public CommandLineRunner initDatabase(
            UserRepository userRepository,
            ProductRepository productRepository,
            OrderRepository orderRepository,
            OrderReportRepository orderReportRepository,
            ProductReportRepository productReportRepository) {

        return args -> {
            // 1. Init User admin/123456
            if (!userRepository.existsByUserName("admin")) {
                User admin = new User("admin", "123456");
                userRepository.save(admin);
            }

            // 2. Init Sample Products
            if (productRepository.count() == 0) {
                Product p1 = new Product();
                p1.setName("Laptop Dell XPS 15");
                p1.setDescription("Intel Core i7 13th Gen, 16GB RAM, 512GB SSD");
                p1.setPrice(BigDecimal.valueOf(1500.00));
                p1.setQuantity(20);
                productRepository.save(p1);

                Product p2 = new Product();
                p2.setName("Bàn phím cơ Logitech G Pro");
                p2.setDescription("RGB Mechanical Gaming Keyboard, GX Blue Switch");
                p2.setPrice(BigDecimal.valueOf(129.99));
                p2.setQuantity(50);
                productRepository.save(p2);

                Product p3 = new Product();
                p3.setName("Chuột Logitech MX Master 3S");
                p3.setDescription("Wireless Performance Mouse, 8K DPI Sensor");
                p3.setPrice(BigDecimal.valueOf(99.00));
                p3.setQuantity(35);
                productRepository.save(p3);
            }

            // 3. Init Sample Order
            if (orderRepository.count() == 0) {
                Order order = new Order();
                order.setCustomerName("Nguyễn Văn An");
                order.setCustomerEmail("nguyenvanan@gmail.com");
                order.setStatus("completed");

                Product p1 = productRepository.findAll().get(0);
                OrderItem item = new OrderItem();
                item.setProductId(p1.getId());
                item.setProductName(p1.getName());
                item.setQuantity(1);
                item.setUnitPrice(p1.getPrice());
                item.setTotalPrice(p1.getPrice());

                order.addItem(item);
                order.setTotalAmount(p1.getPrice());
                Order savedOrder = orderRepository.save(order);

                // 4. Init Sample Order Report
                if (orderReportRepository.count() == 0) {
                    OrderReport report = new OrderReport();
                    report.setOrderId(savedOrder.getId());
                    report.setTotalRevenue(savedOrder.getTotalAmount());
                    report.setTotalCost(BigDecimal.valueOf(1050.00));
                    report.setTotalProfit(BigDecimal.valueOf(450.00));
                    OrderReport savedReport = orderReportRepository.save(report);

                    ProductReport prodReport = new ProductReport();
                    prodReport.setOrderReportId(savedReport.getId());
                    prodReport.setProductId(p1.getId());
                    prodReport.setProductName(p1.getName());
                    prodReport.setTotalSold(1);
                    prodReport.setRevenue(p1.getPrice());
                    prodReport.setCost(BigDecimal.valueOf(1050.00));
                    prodReport.setProfit(BigDecimal.valueOf(450.00));
                    productReportRepository.save(prodReport);
                }
            }
        };
    }
}
