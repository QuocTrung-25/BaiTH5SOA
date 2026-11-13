# BÀI THỰC HÀNH SỐ 4 — ORDER MANAGEMENT SERVICE

Dịch vụ Quản lý Đơn hàng (Order Management) được xây dựng theo kiến trúc hướng dịch vụ (**SOA - Service-Oriented Architecture**), chạy độc lập trên cổng `8082`, sử dụng cơ sở dữ liệu riêng biệt và xác thực thông qua **JWT Token** từ Auth Service (Bài thực hành 2).

---

## 1. Kiến trúc tổng thể hệ thống SOA

Hệ thống bao gồm 3 microservices hoạt động độc lập:

| Dịch vụ | Cổng | Cơ sở dữ liệu | Trách nhiệm |
| :--- | :--- | :--- | :--- |
| **Auth Service** (Bài 2) | `8080` | MySQL `user` | Quản lý người dùng, cấp phát JWT token |
| **Product Service** (Bài 3) | `8081` | H2 `products.mv.db` | Quản lý danh mục sản phẩm và tồn kho |
| **Order Service** (Bài 4) | `8082` | H2 `orders.mv.db` | Quản lý đơn hàng, chi tiết đơn hàng, kiểm tra tồn kho |

---

## 2. Mô hình Dữ liệu (Database Schema)

Dịch vụ quản lý 2 bảng trong cơ sở dữ liệu riêng:

### Bảng `orders` (Đơn hàng)
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT): Mã đơn hàng
- `customer_name` (VARCHAR(255), NOT NULL): Tên khách hàng
- `customer_email` (VARCHAR(255), NOT NULL): Email khách hàng
- `total_amount` (DECIMAL(10,2), NOT NULL): Tổng giá trị đơn hàng
- `status` (VARCHAR(50), NOT NULL): Trạng thái đơn (`pending`, `completed`, `cancelled`)
- `created_at` (TIMESTAMP, NOT NULL): Thời gian tạo đơn
- `updated_at` (TIMESTAMP, NOT NULL): Thời gian cập nhật lần cuối

### Bảng `order_items` (Chi tiết đơn hàng)
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT): Mã chi tiết đơn
- `order_id` (INT, FOREIGN KEY -> orders.id): Mã đơn hàng
- `product_id` (INT, NOT NULL): Mã sản phẩm (lưu vết liên kết với Product Service)
- `product_name` (VARCHAR(255), NOT NULL): Tên sản phẩm tại thời điểm đặt
- `quantity` (INT, NOT NULL): Số lượng đặt mua (> 0)
- `unit_price` (DECIMAL(10,2), NOT NULL): Đơn giá tại thời điểm đặt
- `total_price` (DECIMAL(10,2), NOT NULL): Thành tiền (`quantity * unit_price`)

---

## 3. Cách khởi chạy hệ thống

Mở 3 terminal riêng biệt để chạy 3 service:

### Terminal 1: Auth Service (Port 8080)
```powershell
# Tại thư mục gốc BaiTh2SOA
mvn spring-boot:run
```

### Terminal 2: Product Service (Port 8081)
```powershell
cd product-service
mvn spring-boot:run
```

### Terminal 3: Order Service (Port 8082)
```powershell
cd order-service
mvn spring-boot:run
```

---

## 4. Giao diện Web Quản lý Đơn hàng

Truy cập trình duyệt tại:
👉 `http://localhost:8082`

**Tính năng giao diện:**
1. **Đăng nhập JWT:** Tự động kết nối với Auth Service tại `localhost:8080` (tài khoản demo: `admin` / `123456`).
2. **Dashboard thống kê:** Tổng đơn hàng, đơn chờ xử lý, đơn hoàn thành và doanh thu.
3. **Tạo đơn hàng mới (Kiểm tra tồn kho):**
   - Tải danh mục sản phẩm trực tiếp từ Product Service `localhost:8081`.
   - Hiển thị số lượng tồn kho theo thời gian thực.
   - Báo lỗi ngay lập tức nếu đặt quá số lượng tồn kho.
   - Tự động tính thành tiền và tổng đơn.
4. **Xem chi tiết & quản lý mặt hàng:** Thêm sản phẩm trực tiếp vào đơn, chỉnh sửa số lượng, xóa sản phẩm.
5. **Cập nhật trạng thái:** Nhanh chóng chuyển trạng thái `pending`, `completed`, `cancelled`. Khi hủy đơn hàng, hệ thống tự động hoàn trả số lượng sản phẩm vào kho của Product Service.

---

## 5. Danh sách RESTful APIs

Tất cả các API yêu cầu Header: `Authorization: Bearer <JWT_TOKEN>`

### 5.1 Quản lý Đơn hàng (`/orders`)

| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| `GET` | `/orders` | Lấy danh sách tất cả các đơn hàng |
| `GET` | `/orders/{id}` | Lấy thông tin chi tiết một đơn hàng kèm các mặt hàng |
| `POST` | `/orders` | Tạo đơn hàng mới (kiểm tra tồn kho qua Product Service) |
| `PUT` | `/orders/{id}` | Cập nhật trạng thái đơn hàng (`pending`, `completed`, `cancelled`) |
| `DELETE` | `/orders/{id}` | Xóa một đơn hàng (xóa kèm các mặt hàng liên quan) |

#### Ví dụ Body tạo đơn hàng (`POST /orders`):
```json
{
  "customer_name": "Nguyễn Văn A",
  "customer_email": "nguyenvana@gmail.com",
  "status": "pending",
  "items": [
    {
      "product_id": 1,
      "quantity": 2
    }
  ]
}
```

#### Ví dụ Body cập nhật trạng thái (`PUT /orders/{id}`):
```json
{
  "status": "completed"
}
```

---

### 5.2 Quản lý Chi tiết Đơn hàng (`/order_items`)

| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| `GET` | `/order_items` | Lấy danh sách tất cả mặt hàng (hoặc `?order_id={id}`) |
| `GET` | `/order_items/{id}` | Lấy thông tin chi tiết một mặt hàng |
| `POST` | `/order_items` | Tạo mặt hàng mới trong đơn (kiểm tra tồn kho) |
| `PUT` | `/order_items/{id}` | Cập nhật số lượng / đơn giá mặt hàng |
| `DELETE` | `/order_items/{id}` | Xóa một mặt hàng (tự động cập nhật lại tổng tiền đơn) |

#### Ví dụ Body thêm mặt hàng (`POST /order_items`):
```json
{
  "order_id": 1,
  "product_id": 2,
  "quantity": 3
}
```

#### Ví dụ Body cập nhật mặt hàng (`PUT /order_items/{id}`):
```json
{
  "quantity": 5
}
```

---

## 6. Kiểm thử tự động (Automated Tests)

Chạy bộ kiểm thử tích hợp (Integration Tests):

```powershell
cd order-service
mvn test
```

Bộ test kiểm tra toàn diện:
- Xác thực 401 khi không có token.
- Tạo đơn hàng và kiểm tra tồn kho thành công.
- Xử lý lỗi khi số lượng yêu cầu vượt quá tồn kho (400 Bad Request).
- Thêm, sửa, xóa mặt hàng và tự động cập nhật tổng tiền đơn hàng cha.
