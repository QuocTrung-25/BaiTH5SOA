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

- userName: `admin`
- password thật: `123456`
- password gửi lên API: Base64(`123456`) = `MTIzNDU2`

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

## Luồng

Client -> POST /auth -> kiểm tra User -> JwtService tạo JWT -> Client

Client -> GET /hello + Bearer JWT -> JwtAuthenticationFilter -> kiểm tra JWT -> HelloController.
