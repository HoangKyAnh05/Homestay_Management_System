# Homestay Management System

Hệ thống quản lý và đặt phòng homestay, hỗ trợ đăng nhập thường và đăng nhập Google, quản lý hồ sơ người dùng, đặt lại mật khẩu qua OTP email.

---

## Công nghệ sử dụng

**Backend**
- Java 21
- Spring Boot 4.0.6
- Spring Security + JWT
- Spring Data JPA + Hibernate
- MySQL 8
- JavaMailSender (Gmail SMTP)

**Frontend**
- React 19
- Vite 8
- Google Identity Services (OAuth 2.0)

---

## Cấu trúc dự án

```
Homestay_Management_System/
│
├── homestayManagement/              # Backend Spring Boot
│   └── src/main/java/.../
│       ├── config/                  # Cấu hình Security, CORS, Jackson
│       ├── controller/              # REST API endpoints
│       ├── dto/
│       │   ├── request/             # Các request body
│       │   └── response/            # Các response body
│       ├── entity/                  # JPA entities (database models)
│       ├── repository/              # Spring Data JPA repositories
│       ├── security/                # JWT filter & authentication
│       └── service/
│           ├── impl/                # Implementations
│           └── ...                  # Service interfaces
│
└── frontendHomestayManagement/      # Frontend React + Vite
    └── src/
        ├── components/              # Các component dùng chung
        ├── pages/                   # Các trang (Home, Login, Register, Profile, ForgotPassword)
        └── services/                # Toàn bộ API calls
```

---

## Hướng dẫn chạy dự án

### Bước 1 — Cấu hình Backend

Tạo file mới tại đường dẫn:

```
homestayManagement/src/main/resources/application-local.properties
```

Dán nội dung sau vào, **chỉ thay `DB_PORT`** thành port MySQL trên máy bạn (thường là `3306`), các giá trị còn lại do trưởng nhóm cung cấp:

```properties
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=123456
JWT_SECRET=<do_truong_nhom_cung_cap>
GOOGLE_CLIENT_ID=<do_truong_nhom_cung_cap>
MAIL_USERNAME=<do_truong_nhom_cung_cap>
MAIL_PASSWORD=<do_truong_nhom_cung_cap>
```

### Bước 2 — Cấu hình Frontend

Tạo file mới tại đường dẫn:

```
frontendHomestayManagement/.env
```

Dán nội dung sau vào, dùng cùng `GOOGLE_CLIENT_ID` với backend:

```env
VITE_GOOGLE_CLIENT_ID=<do_truong_nhom_cung_cap>
```

### Bước 3 — Chạy Backend

Đảm bảo MySQL đang chạy, sau đó mở terminal tại thư mục gốc:

```bash
cd homestayManagement
./mvnw spring-boot:run
```

Trên Windows:

```bash
cd homestayManagement
mvnw.cmd spring-boot:run
```

Backend chạy tại: `http://localhost:8080`

### Bước 4 — Chạy Frontend

Mở terminal mới:

```bash
cd frontendHomestayManagement
npm install
npm run dev
```

Frontend chạy tại: `http://localhost:5173`
