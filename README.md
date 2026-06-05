# Hệ Thống Quản Lý Homestay

## 📋 Giới Thiệu Dự Án

## 📋 Giới Thiệu Dự Án(test)

**Hệ Thống Quản Lý Homestay** là một ứng dụng web toàn diện được xây dựng để hỗ trợ quản lý các cơ sở lưu trú kiểu homestay. Ứng dụng cho phép:

- 👤 Quản lý tài khoản người dùng (đăng ký, đăng nhập, xác thực)
- 🏠 Quản lý thông tin homestay
- 📋 Quản lý đơn đặt phòng
- 👥 Quản lý người dùng và vai trò
- 🔐 Hệ thống bảo mật với xác thực JWT

---

## 🛠 Công Nghệ Sử Dụng

### Frontend
- **Framework**: React 18 (Vite)
- **Build Tool**: Vite
- **Linting**: ESLint
- **Package Manager**: npm

### Backend
- **Framework**: Spring Boot 3.x
- **Language**: Java
- **Build Tool**: Maven
- **Database**: MySQL/PostgreSQL (cấu hình trong application.properties)
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Spring Security

---

## 📁 Cấu Trúc Thư Mục Code

```
Homestay_Management_System/
│
├── 📂 frontendHomestayManagement/          # Frontend React + Vite
│   ├── package.json
│   ├── vite.config.js
│   ├── eslint.config.js
│   ├── index.html
│   ├── 📂 public/                          # Tài nguyên tĩnh công khai
│   ├── 📂 src/                             # Mã nguồn chính
│   │   ├── main.jsx                        # Entry point của ứng dụng
│   │   ├── App.jsx                         # Component Root
│   │   ├── index.css                       # CSS toàn cục
│   │   ├── 📂 assets/                      # Hình ảnh, fonts, media
│   │   ├── 📂 components/                  # Các component tái sử dụng
│   │   │   ├── HomeSearch/
│   │   │   ├── LoginForm/
│   │   │   ├── LoginHero/
│   │   │   └── RegisterForm/
│   │   ├── 📂 pages/                       # Các trang chính
│   │   │   ├── Home/
│   │   │   ├── Login/
│   │   │   └── Register/
│   │   ├── 📂 routes/                      # Cấu hình routing
│   │   ├── 📂 services/                    # API services
│   │   │   └── authService.js              # Xác thực, gọi API
│   │   └── 📂 public/                      # Public assets khác
│   │
│   └── node_modules/                       # Thư viện npm
│
├── 📂 homestayManagement/                  # Backend Spring Boot
│   ├── pom.xml                             # Maven configuration
│   ├── mvnw & mvnw.cmd                     # Maven wrapper
│   ├── 📂 src/
│   │   ├── 📂 main/
│   │   │   ├── 📂 java/com/homestayManagement/homestayManagement/
│   │   │   │   ├── HomestayManagementApplication.java         # Main class
│   │   │   │   ├── 📂 config/                                # Cấu hình ứng dụng
│   │   │   │   ├── 📂 controller/                            # REST Controllers
│   │   │   │   ├── 📂 dto/                                   # Data Transfer Objects
│   │   │   │   │   ├── request/                              # Request DTOs
│   │   │   │   │   └── response/                             # Response DTOs
│   │   │   │   ├── 📂 entity/                                # JPA Entities / Models
│   │   │   │   ├── 📂 repository/                            # Data Access Layer
│   │   │   │   ├── 📂 service/                               # Business Logic Layer
│   │   │   │   │   ├── AuthService.java
│   │   │   │   │   └── impl/                                 # Service implementations
│   │   │   │   ├── 📂 security/                              # Security & Authentication
│   │   │   │   └── 📂 exception/                             # Custom Exceptions
│   │   │   │
│   │   │   └── 📂 resources/
│   │   │       ├── application.properties  # Cấu hình DB, server port
│   │   │       └── 📂 static/              # Static files (CSS, JS, images)
│   │   │
│   │   └── 📂 test/
│   │       └── 📂 java/                    # Unit tests
│   │
│   ├── 📂 target/                          # Build output
│   └── 📂 uploads/                         # Thư mục upload file

└── README.md                               # Tập tin này
```

---

## 🚀 Hướng Dẫn Chạy Dự Án

### Yêu Cầu Hệ Thống

#### Backend
- **Java JDK**: 11 hoặc cao hơn
- **Maven**: 3.6 hoặc cao hơn (hoặc sử dụng Maven Wrapper)
- **Database**: MySQL 5.7+ hoặc PostgreSQL

#### Frontend
- **Node.js**: 16 hoặc cao hơn
- **npm**: 8 hoặc cao hơn

---

### ⚙️ Hướng Dẫn Chạy Backend

#### Bước 1: Cấu Hình Database
Mở file `homestayManagement/src/main/resources/application.properties` và cấu hình kết nối database:

```properties
# MySQL
spring.datasource.url=jdbc:mysql://localhost:3306/homestay_db
spring.datasource.username=root
spring.datasource.password=your_password
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
spring.jpa.hibernate.ddl-auto=update
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect

# PostgreSQL (tùy chọn)
# spring.datasource.url=jdbc:postgresql://localhost:5432/homestay_db
# spring.datasource.username=postgres
# spring.datasource.password=your_password
```

#### Bước 2: Build Backend
Trong thư mục `homestayManagement/`, chạy lệnh:

**Trên Windows:**
```bash
mvnw.cmd clean install
```

**Trên Linux/Mac:**
```bash
./mvnw clean install
```

Hoặc nếu đã cài Maven:
```bash
mvn clean install
```

#### Bước 3: Chạy Backend
```bash
mvnw.cmd spring-boot:run
```

Hoặc:
```bash
mvn spring-boot:run
```

Backend sẽ chạy tại: **http://localhost:8080**

---

### 🎨 Hướng Dẫn Chạy Frontend

#### Bước 1: Cài Đặt Dependencies
Trong thư mục `frontendHomestayManagement/`, chạy:

```bash
npm install
```

#### Bước 2: Cấu Hình API Endpoint (nếu cần)
Kiểm tra file `src/services/authService.js` và các service khác để đảm bảo API endpoint trỏ đúng:

```javascript
// Ví dụ
const API_BASE_URL = 'http://localhost:8080/api';
```

#### Bước 3: Chạy Development Server
```bash
npm run dev
```

Frontend sẽ chạy tại: **http://localhost:5173** (hoặc port khác nếu 5173 bận)

#### Bước 4: Build Production (tùy chọn)
```bash
npm run build
```

---

## 📝 Các Lệnh Hữu Ích

### Backend
```bash
# Clean build
mvn clean package

# Chạy tests
mvn test

# Chỉ compile
mvn compile
```

### Frontend
```bash
# Kiểm tra linting
npm run lint

# Build cho production
npm run build

# Preview production build
npm run preview
```

---

## 🔐 Bảo Mật

- Ứng dụng sử dụng **Spring Security** và **JWT tokens** cho xác thực
- Mật khẩu được mã hóa bằng **BCrypt**
- CORS được cấu hình để cho phép frontend access backend

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề:
1. Kiểm tra database connection
2. Xác nhận ports 8080 (backend) và 5173 (frontend) không bận
3. Kiểm tra phiên bản Java, Node.js và npm
4. Xem logs chi tiết trong console

---

## 📄 Licen

Dự án này được tạo cho mục đích học tập.

---

**Cập nhật lần cuối:** Tháng 6, 2026