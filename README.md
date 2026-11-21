# Hệ Thống Microservices Kiến Trúc SOA (Labs 2, 3, 4, 5)

Dự án được tái cấu trúc hoàn chỉnh thành 2 thư mục riêng biệt:
- **`backend/`**: Chứa toàn bộ 4 Microservices độc lập (Spring Boot 3, Java 21, H2 Database riêng biệt cho mỗi service).
- **`frontend/`**: Giao diện Dashboard quản trị hợp nhất (HTML5, Modern CSS, Vanilla JS) kết nối đồng thời cả 4 Microservices.

---

## 📁 Cấu Trúc Thư Mục (Project Architecture)

```
BaiTh2SOA/
├── backend/
│   ├── auth-service/           # [Lab 2] Cổng 8080 - Cấp phát & xác thực JWT Token
│   ├── product-service/        # [Lab 3] Cổng 8081 - Quản lý sản phẩm & tồn kho
│   ├── order-service/          # [Lab 4] Cổng 8082 - Quản lý đơn hàng & chi tiết đơn
│   └── reporting-service/      # [Lab 5] Cổng 8083 - Báo cáo doanh thu, chi phí, lợi nhuận
│       └── reporting_service.sql # File SQL khởi tạo CSDL Lab 5
├── frontend/                   # Giao diện Web SPA hợp nhất
│   ├── index.html              # Trang chủ Dashboard điều khiển 4 Services
│   ├── styles.css              # Giao diện hiện đại (Modern UI, responsive, modals)
│   └── app.js                  # Xử lý gọi API RESTful đồng bộ JWT Token
├── pom.xml                     # Maven Multi-Module Root Aggregator
└── README.md
```

---

## 🌐 Danh Sách Microservices & Cổng Hoạt Động

| Dịch vụ (Service) | Cổng (Port) | Cơ sở dữ liệu (Database) | Chức năng chính |
| :--- | :--- | :--- | :--- |
| **Auth Service** | `8080` | H2 In-Memory / MySQL | Đăng nhập (`admin` / `123456`), phát hành & kiểm tra JWT token |
| **Product Service** | `8081` | H2 File: `product_db` | CRUD sản phẩm, kiểm soát số lượng tồn kho |
| **Order Service** | `8082` | H2 File: `orders_db` | CRUD đơn hàng (`orders`), chi tiết đơn (`order_items`), kiểm tra tồn kho từ :8081 |
| **Reporting Service** | `8083` | H2 File: `reporting_db` | Thống kê doanh thu, chi phí, lợi nhuận theo đơn hàng & sản phẩm |

---

## 🚀 Hướng Dẫn Khởi Chạy

### 1. Biên dịch và kiểm thử toàn bộ Backend (Root)
Từ thư mục gốc `BaiTh2SOA`:
```powershell
mvn clean test
```
*(Cả 4 module sẽ được biên dịch và chạy unit/integration tests thành công 100%).*

---

### 2. Khởi chạy 4 Microservices

Mở 4 cửa sổ Terminal riêng biệt:

#### Terminal 1: Auth Service (Port 8080)
```powershell
cd backend/auth-service
mvn spring-boot:run
```

#### Terminal 2: Product Service (Port 8081)
```powershell
cd backend/product-service
mvn spring-boot:run
```

#### Terminal 3: Order Service (Port 8082)
```powershell
cd backend/order-service
mvn spring-boot:run
```

#### Terminal 4: Reporting Service (Port 8083)
```powershell
cd backend/reporting-service
mvn spring-boot:run
```

---

### 3. Mở Giao Diện Web (Frontend)

Mở trực tiếp file `frontend/index.html` bằng trình duyệt (hoặc dùng VS Code Live Server, Python `python -m http.server 3000`):
- Đường dẫn: `file:///c:/Users/Admin/Downloads/BaiTh2SOA/frontend/index.html`
- Giao diện có sẵn tính năng:
  - 🔄 Nút **"Kiểm tra Service"**: Tự động ping 4 cổng `8080`, `8081`, `8082`, `8083`.
  - 🔑 **Tab Auth Service**: Đăng nhập nhanh với tài khoản `admin` / `123456`, lưu token vào LocalStorage.
  - 📦 **Tab Product Service**: Thêm, sửa, xóa sản phẩm, theo dõi tồn kho trực quan.
  - 🛒 **Tab Order Service**: Tạo đơn hàng mới (tự động tải sản phẩm từ `:8081` để chọn và kiểm tra kho), xem chi tiết mặt hàng, cập nhật trạng thái đơn (`pending`, `completed`, `cancelled`).
  - 📊 **Tab Reporting Service**: Tạo báo cáo doanh thu theo đơn hàng (`orders_reports`) hoặc sản phẩm (`product_reports`), tự động tính `total_revenue`, `total_cost`, `total_profit`.

---

## 📡 RESTful API Documentation

### 1. Auth Service (`http://localhost:8080`)
- `POST /api/v1/login`: Đăng nhập nhận JWT Token. Body: `{"username": "admin", "password": "..."}`
- `GET /api/v1/hello`: Test xác thực JWT (yêu cầu header `Authorization: Bearer <token>`)

### 2. Product Service (`http://localhost:8081`)
- `GET /products`: Danh sách tất cả sản phẩm
- `GET /products/{id}`: Chi tiết sản phẩm
- `POST /products`: Tạo sản phẩm mới (`name`, `description`, `price`, `quantity`)
- `PUT /products/{id}`: Cập nhật thông tin sản phẩm
- `DELETE /products/{id}`: Xóa sản phẩm

### 3. Order Service (`http://localhost:8082`)
- `GET /orders`: Danh sách tất cả các đơn hàng
- `GET /orders/{id}`: Chi tiết đơn hàng
- `POST /orders`: Tạo đơn hàng mới (tự kiểm tra tồn kho từ Product Service)
- `PUT /orders/{id}?status={status}`: Cập nhật trạng thái đơn hàng (`pending`, `completed`, `cancelled`)
- `DELETE /orders/{id}`: Xóa đơn hàng
- `GET /order_items`: Danh sách tất cả mặt hàng trong đơn hàng
- `GET /order_items/{id}`: Chi tiết một mặt hàng
- `POST /order_items`: Thêm mặt hàng mới vào đơn
- `PUT /order_items/{id}`: Cập nhật mặt hàng
- `DELETE /order_items/{id}`: Xóa một mặt hàng

### 4. Reporting Service (`http://localhost:8083`)
- `GET /reports/orders`: Danh sách tất cả báo cáo theo đơn hàng
- `GET /reports/orders/{id}`: Chi tiết báo cáo cho một đơn hàng
- `POST /reports/orders?orderId={id}`: Tạo báo cáo đơn hàng mới (tự động tính doanh thu, chi phí, lợi nhuận)
- `DELETE /reports/orders/{id}`: Xóa báo cáo đơn hàng
- `GET /reports/products`: Danh sách báo cáo theo sản phẩm
- `GET /reports/products/{id}`: Chi tiết báo cáo cho một sản phẩm
- `POST /reports/products?orderReportId={id}&productId={id}&totalSold={n}`: Tạo báo cáo sản phẩm mới
- `DELETE /reports/products/{id}`: Xóa báo cáo sản phẩm
- **File SQL đính kèm:** `backend/reporting-service/reporting_service.sql`
