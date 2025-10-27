# LIORA BEAUTY E-COMMERCE SYSTEM

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.6-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Java](https://img.shields.io/badge/Java-21-orange.svg)](https://www.oracle.com/java/)
[![Maven](https://img.shields.io/badge/Maven-3.6+-blue.svg)](https://maven.apache.org/)
[![SQL Server](https://img.shields.io/badge/SQL%20Server-2019+-red.svg)](https://www.microsoft.com/sql-server)

## MÔ TẢ DỰ ÁN

Liora Beauty là hệ thống thương mại điện tử chuyên về mỹ phẩm và chăm sóc da, được phát triển bằng Spring Boot với các tính năng hiện đại và tích hợp đầy đủ các dịch vụ bên thứ ba.

## TÍNH NĂNG CHÍNH

### Cho Người Dùng
- **Mua sắm trực tuyến** với giao diện thân thiện
- **Tìm kiếm và lọc sản phẩm** thông minh
- **Giỏ hàng và thanh toán** đa dạng (COD, VNPay, MOMO)
- **Theo dõi đơn hàng** real-time
- **Đánh giá sản phẩm** và review
- **Chatbot AI** hỗ trợ 24/7

### Cho Quản Trị
- **Dashboard analytics** với biểu đồ trực quan
- **Quản lý sản phẩm** với upload ảnh tự động
- **Quản lý đơn hàng** và khách hàng
- **Hệ thống phân quyền** chi tiết
- **Báo cáo thống kê** đa chiều
- **Tích hợp GHN** cho giao hàng

## CÔNG NGHỆ SỬ DỤNG

### Backend
- **Spring Boot 3.5.6** - Framework chính
- **Spring Security** - Bảo mật và xác thực
- **Spring Data JPA** - ORM và database
- **Thymeleaf** - Template engine
- **MapStruct** - Object mapping
- **Lombok** - Giảm boilerplate code

### Frontend
- **Bootstrap 5** - CSS framework
- **JavaScript ES6+** - Frontend logic
- **Chart.js** - Biểu đồ thống kê
- **Material Design Icons** - Icons

### Database
- **Microsoft SQL Server** - Cơ sở dữ liệu chính
- **H2 Database** - Database temp

### Tích Hợp Bên Thứ Ba
- **VNPay, MOMO** - Thanh toán online
- **GHN Express** - Giao hàng
- **Google Gemini AI** - Chatbot
- **Google OAuth** - Đăng nhập xã hội

## CÀI ĐẶT

### Yêu Cầu Hệ Thống
- Java 21+
- Maven 3.6+
- SQL Server 2019+
- IDE (IntelliJ IDEA/Eclipse)

### Cài Đặt Nhanh
```bash
# 1. Clone repository
git clone [repository_url]
cd PROJECT_LIORA

# 2. Cấu hình database
# Tạo database LioraDB trong SQL Server
# Cập nhật thông tin kết nối trong application.properties

# 3. Cấu hình API keys
# VNPay, GHN, Google OAuth, Gemini AI

# 4. Chạy dự án
mvn spring-boot:run
```

### Truy Cập Hệ Thống
- **Website:** http://localhost:8080
- **Admin:** http://localhost:8080/admin
- **API Docs:** http://localhost:8080/swagger-ui.html

## TÀI LIỆU

- [User Manual](User_Manual_Liora_Beauty.md) - Hướng dẫn sử dụng chi tiết
- [Installation Guide](INSTALLATION_GUIDE.md) - Hướng dẫn cài đặt
- [API Documentation](docs/api.md) - Tài liệu API
- [Database Schema](docs/database.md) - Sơ đồ cơ sở dữ liệu

## KIẾN TRÚC HỆ THỐNG

```
src/main/java/vn/liora/
├── annotation/          # Custom annotations
├── config/             # Configuration classes
├── controller/         # REST & Web controllers
├── dto/               # Data Transfer Objects
├── entity/            # JPA Entities
├── enums/             # Enum classes
├── exception/         # Custom exceptions
├── mapper/            # MapStruct mappers
├── repository/        # JPA Repositories
├── service/           # Business logic
├── util/              # Utility classes
└── validator/         # Custom validators
```

## CẤU HÌNH

### Database Configuration
```properties
spring.datasource.url=jdbc:sqlserver://localhost:1433;databaseName=LioraDB
spring.datasource.username=sa
spring.datasource.password=your_password
```

### VNPay Configuration
```properties
vnpay.tmnCode=your_tmn_code
vnpay.hashSecret=your_hash_secret
```

### MOMO Configuration
```properties
momo.partnerCode=your_partner_code
momo.accessKey=your_access_key
momo.secretKey=your_secret_key
```

### GHN Configuration
```properties
ghn.api.token=your_ghn_token
ghn.api.shop-id=your_shop_id
ghn.api.service-id=your_service_id
```

## 🧪 TESTING

```bash
# Chạy tất cả tests
mvn test

# Chạy test với coverage
mvn test jacoco:report

# Chạy integration tests
mvn verify
```

## THỐNG KÊ DỰ ÁN

- **Backend:** 25+ Entities, 55+ Services, 46+ Controllers
- **Frontend:** 49+ JavaScript files, 17+ CSS files
- **Templates:** 91+ HTML templates
- **Database:** 15+ Tables với relationships phức tạp
- **API Integration:** VNPay, MOMO, GHN, Google Gemini

## ĐÓNG GÓP

1. Fork dự án
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request


## TÁC GIẢ

- **Trương Công Bình - 23110184** 
- **Trần Lê Quốc Đại - 23110201** 
- **Ninh Thị Mỹ Hạnh - 23110210** 
- **Đoàn Quang Khôi - 23110244**  


## LIÊN HỆ

- **Email:** support@liora.com
- **Hotline:** 0373 801 404
- **Website:** [https://liora.com](https://liora.azurewebsites.net/)
- **GitHub:** [https://github.com/liora-beauty](https://github.com/1440isme/Liora)
---
