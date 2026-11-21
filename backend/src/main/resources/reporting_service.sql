-- ====================================================================
-- BÀI THỰC HÀNH SỐ 5: DỊCH VỤ BÁO CÁO (REPORTING SERVICE)
-- CSDL RIÊNG: reporting_db (Tương thích MySQL / MariaDB / H2)
-- Cổng dịch vụ: http://localhost:8083
-- ====================================================================

CREATE DATABASE IF NOT EXISTS `reporting_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `reporting_db`;

-- 1. Bảng báo cáo đơn hàng (orders_reports)
DROP TABLE IF EXISTS `product_reports`;
DROP TABLE IF EXISTS `orders_reports`;

CREATE TABLE `orders_reports` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `order_id` INT NOT NULL COMMENT 'ID của đơn hàng từ Order Service (:8082)',
    `total_revenue` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Tổng doanh thu của đơn hàng',
    `total_cost` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Tổng chi phí nhập sản phẩm',
    `total_profit` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Tổng lợi nhuận (total_revenue - total_cost)',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_orders_reports_order_id` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Bảng báo cáo sản phẩm (product_reports)
CREATE TABLE `product_reports` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `order_report_id` INT NULL DEFAULT NULL COMMENT 'ID liên kết với bảng orders_reports',
    `product_id` INT NOT NULL COMMENT 'ID sản phẩm từ Product Service (:8081)',
    `product_name` VARCHAR(255) NULL DEFAULT NULL COMMENT 'Tên sản phẩm',
    `total_sold` INT NOT NULL DEFAULT 0 COMMENT 'Tổng số lượng sản phẩm đã bán',
    `revenue` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Doanh thu từ sản phẩm',
    `cost` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Chi phí nhập sản phẩm',
    `profit` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Lợi nhuận (revenue - cost)',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_product_reports_product_id` (`product_id`),
    KEY `idx_product_reports_order_report_id` (`order_report_id`),
    CONSTRAINT `fk_product_reports_order_report` FOREIGN KEY (`order_report_id`) REFERENCES `orders_reports` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- DỮ LIỆU MẪU ĐỂ TEST
-- ====================================================================
INSERT INTO `orders_reports` (`id`, `order_id`, `total_revenue`, `total_cost`, `total_profit`, `created_at`, `updated_at`) VALUES
(1, 1, 300000.00, 210000.00, 90000.00, NOW(), NOW()),
(2, 2, 750000.00, 525000.00, 225000.00, NOW(), NOW());

INSERT INTO `product_reports` (`id`, `order_report_id`, `product_id`, `product_name`, `total_sold`, `revenue`, `cost`, `profit`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 'Bàn phím cơ', 2, 300000.00, 210000.00, 90000.00, NOW(), NOW()),
(2, 2, 2, 'Chuột Gaming', 3, 750000.00, 525000.00, 225000.00, NOW(), NOW());

-- ====================================================================
-- CÁC TRUY VẤN THỐNG KÊ MẪU
-- ====================================================================
-- Tổng doanh thu, chi phí và lợi nhuận toàn hệ thống
SELECT 
    SUM(total_revenue) AS total_revenue,
    SUM(total_cost) AS total_cost,
    SUM(total_profit) AS total_profit
FROM orders_reports;

-- Thống kê theo từng sản phẩm
SELECT 
    product_id,
    product_name,
    SUM(total_sold) AS total_sold,
    SUM(revenue) AS total_revenue,
    SUM(cost) AS total_cost,
    SUM(profit) AS total_profit
FROM product_reports
GROUP BY product_id, product_name;
