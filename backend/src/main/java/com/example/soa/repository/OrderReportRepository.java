package com.example.soa.repository;

import com.example.soa.model.OrderReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OrderReportRepository extends JpaRepository<OrderReport, Integer> {
    Optional<OrderReport> findByOrderId(Integer orderId);
}
