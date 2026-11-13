# JWT RESTful API Lab

Bài thực hành: Router, Middleware và bảo mật với JWT trong RESTful API.

## Công nghệ
- Java 21
- Spring Boot 3.4.2
- Maven
- JJWT 0.12.6
- Postman

## Chạy project

```bash
mvn spring-boot:run
```

Hoặc trên Windows:

```powershell
.\mvnw.cmd spring-boot:run
```

## Tài khoản demo

- Tài khoản được đọc từ database MySQL `user`, bảng `user`.
- Tài khoản mẫu trong ảnh: `admin` / `123456`.
- API chấp nhận cột `Password` lưu mật khẩu thường hoặc Base64; giao diện web tự mã hóa Base64 trước khi gửi.

## API

### 1. POST /auth

URL:
`http://localhost:8080/auth`

Body JSON:

```json
{
  "userName": "admin",
  "password": "MTIzNDU2"
}
```

Response:

```json
{
  "message": "Đăng nhập thành công",
  "token": "..."
}
```

### 2. GET /hello

URL:
`http://localhost:8080/hello`

Header:

```text
Authorization: Bearer <JWT_TOKEN>
```

Response:

```json
{
  "message": "Hello World",
  "userName": "admin"
}
```

Không có token hoặc token sai sẽ nhận HTTP 401.

## Bài thực hành 3: Product Service

Dịch vụ đăng nhập sử dụng MySQL tại `localhost:3306`, database `user`, bảng `user` với các cột `UserName` và `Password`. Mặc định kết nối dùng tài khoản MySQL `root` không mật khẩu (cấu hình XAMPP thường dùng); có thể đặt `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` để dùng cấu hình khác. Mật khẩu trong bảng có thể là `123456` hoặc Base64 của mật khẩu (`MTIzNDU2`). Bảng `products` của giao diện hiện vẫn lưu trong H2 dạng file riêng của `product-service`.

Schema bảng `products` được khởi tạo từ `product-service/src/main/resources/schema.sql`; các cột gồm `id`, `name`, `description`, `price`, `quantity`, `created_at` và `updated_at`. Hibernate tiếp tục tự đồng bộ schema khi ứng dụng chạy.

Giao diện web quản lý sản phẩm được phục vụ tại `http://localhost:8081/`. Để đăng nhập và sử dụng giao diện, mở hai terminal từ thư mục gốc và chạy lần lượt:

```powershell
mvn spring-boot:run
```

```powershell
cd product-service
mvn spring-boot:run
```

Đăng nhập bằng tài khoản demo `admin` / `123456`. Giao diện hỗ trợ tìm kiếm, thêm, sửa và xóa sản phẩm; token chỉ được lưu trong phiên trình duyệt hiện tại.

Nếu đăng nhập báo không gọi được API, hãy dừng và chạy lại ứng dụng JWT ở cổng `8080` để nạp cấu hình CORS cho giao diện tại `http://localhost:8081/`.

`product-service/` là một ứng dụng Spring Boot độc lập với dịch vụ JWT. Nó chạy trên cổng `8081` và lưu dữ liệu trong cơ sở dữ liệu H2 dạng file riêng (`product-service-data/products`). Các API xác thực JWT bằng cùng signing secret của Bài 2; lấy token qua `POST http://localhost:8080/api/v1/auth/login` rồi gửi trong header `Authorization: Bearer <token>`. Chạy dịch vụ từ thư mục gốc:

```powershell
cd product-service
mvn spring-boot:run
```

Các API đều dùng tiền tố `http://localhost:8081/products`:

- `GET /products` xem danh sách sản phẩm.
- `GET /products/{id}` xem một sản phẩm.
- `POST /products` tạo sản phẩm; JSON gồm `name`, `description`, `price`, `quantity`.
- `PUT /products/{id}` cập nhật toàn bộ thông tin sản phẩm.
- `DELETE /products/{id}` xóa sản phẩm.

Ví dụ JSON gửi khi tạo hoặc cập nhật:

```json
{
  "name": "Bàn phím cơ",
  "description": "Bàn phím có dây",
  "price": 890000,
  "quantity": 12
}
```

`name` không được để trống; `price` và `quantity` phải không âm. Sản phẩm cũng có `created_at` và `updated_at` do service quản lý. Các API trả về HTTP `401` nếu thiếu/sai JWT, HTTP `400` nếu dữ liệu không hợp lệ và HTTP `404` nếu không tìm thấy sản phẩm.

## Luồng

Client -> POST /auth -> kiểm tra User -> JwtService tạo JWT -> Client

Client -> GET /hello + Bearer JWT -> JwtAuthenticationFilter -> kiểm tra JWT -> HelloController.

## Bài thực hành 4: Order Service (Order Management)

Dịch vụ quản lý đơn hàng chạy độc lập tại `http://localhost:8082` với cơ sở dữ liệu riêng (`order-service-data/orders`). Dịch vụ tích hợp xác thực JWT với Auth Service (Bài 2) và kiểm tra số lượng tồn kho tự động qua Product Service (Bài 3).

### Chạy dịch vụ
```powershell
cd order-service
mvn spring-boot:run
```

Giao diện web quản lý đơn hàng có tại `http://localhost:8082`. Hỗ trợ đầy đủ các API:
- `GET /orders` & `GET /orders/{id}`
- `POST /orders` (kiểm tra tồn kho qua Product Service)
- `PUT /orders/{id}` (cập nhật trạng thái)
- `DELETE /orders/{id}` (xóa đơn hàng)
- `GET /order_items` & `GET /order_items/{id}`
- `POST /order_items`, `PUT /order_items/{id}`, `DELETE /order_items/{id}`

Chi tiết tài liệu và Postman collection xem tại thư mục `order-service/`.

