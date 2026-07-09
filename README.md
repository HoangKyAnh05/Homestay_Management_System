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

---

## Hướng Dẫn Setup AI Chat Bằng OpenRouter

Customer AI Chat gồm 3 phần:

1. Frontend React hiển thị icon chat và gọi backend tại `http://localhost:8080/api/ai/customer/chat`.
2. Backend Spring Boot xác thực request, gom context phòng/booking và gọi Python sidecar tại `http://127.0.0.1:8001/customer/chat`.
3. Python sidecar trong `openchatbi/customer_assistant` gọi OpenRouter bằng API key.

API key chỉ được đặt trong file `.env` của sidecar. Không đặt API key trong React, `VITE_*`, localStorage, Git hoặc request từ trình duyệt.

### Bước 1 - Lấy API key OpenRouter

1. Truy cập [OpenRouter](https://openrouter.ai/).
2. Đăng nhập hoặc tạo tài khoản.
3. Vào phần API Keys: [https://openrouter.ai/settings/keys](https://openrouter.ai/settings/keys).
4. Tạo key mới và sao chép key ngay sau khi tạo.
5. Kiểm tra tài khoản còn credit hoặc model bạn chọn có thể sử dụng được.

### Bước 2 - Tạo file cấu hình cho AI sidecar

```powershell
cd D:\do_an\Homestay_Management_System\openchatbi
Copy-Item customer_assistant\.env.example customer_assistant\.env
```

Mở `openchatbi/customer_assistant/.env` và điền:

```dotenv
OPENAI_API_KEY=sk-or-your-openrouter-api-key
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_MODEL=openrouter/auto
AI_INTERNAL_TOKEN=replace-with-a-long-random-secret
```

Tạo `AI_INTERNAL_TOKEN` ngẫu nhiên:

```powershell
([guid]::NewGuid().ToString("N") + [guid]::NewGuid().ToString("N"))
```

`OPENAI_MODEL` có thể để `openrouter/auto` hoặc đổi sang model cụ thể trên OpenRouter, ví dụ `openai/gpt-4o-mini`.

### Bước 3 - Cấu hình backend

Mở `homestayManagement/src/main/resources/application-local.properties`, thêm hoặc cập nhật:

```properties
AI_CUSTOMER_SERVICE_URL=http://127.0.0.1:8001
AI_INTERNAL_TOKEN=the-same-random-secret-as-sidecar
AI_CUSTOMER_TIMEOUT_SECONDS=60
AI_CUSTOMER_RATE_LIMIT_PER_MINUTE=20

AI_CUSTOMER_SIDECAR_AUTO_START=true
AI_CUSTOMER_SIDECAR_WORKING_DIRECTORY=../openchatbi
AI_CUSTOMER_SIDECAR_ENV_FILE=customer_assistant/.env
AI_CUSTOMER_SIDECAR_UV_COMMAND=uv
```

`AI_INTERNAL_TOKEN` ở backend phải giống hệt `AI_INTERNAL_TOKEN` trong `openchatbi/customer_assistant/.env`.

### Bước 4 - Cài dependencies cho AI sidecar

Chạy một lần:

```powershell
cd D:\do_an\Homestay_Management_System\openchatbi
uv sync
```

Máy cần cài `uv`. Sau khi setup xong, bạn không cần chạy sidecar thủ công; backend sẽ tự bật sidecar khi chạy.

### Bước 5 - Chạy và kiểm tra

Chạy backend:

```powershell
cd D:\do_an\Homestay_Management_System\homestayManagement
.\mvnw.cmd spring-boot:run
```

Chạy frontend:

```powershell
cd D:\do_an\Homestay_Management_System\frontendHomestayManagement
npm run dev
```

Kiểm tra sidecar:

```powershell
Invoke-RestMethod http://127.0.0.1:8001/health
```

Kết quả đúng:

```json
{
  "status": "UP",
  "api_key_configured": true,
  "internal_token_configured": true,
  "model": "openrouter/auto",
  "base_url": "https://openrouter.ai/api/v1"
}
```

### Lỗi thường gặp

`AI chat chưa được cấu hình API key`

- Sidecar chưa nhận được `OPENAI_API_KEY`.
- Kiểm tra `.env`, restart backend, và bảo đảm không còn process Python cũ đang giữ port `8001`.

Kiểm tra process port `8001`:

```powershell
Get-NetTCPConnection -LocalPort 8001
```

Tắt process cũ:

```powershell
Stop-Process -Id <PID> -Force
```

`Invalid internal token`

- `AI_INTERNAL_TOKEN` trong backend và sidecar khác nhau.
- Sửa để hai file dùng cùng một token.

`Model AI không hợp lệ`

- `OPENAI_MODEL` không tồn tại hoặc tài khoản OpenRouter không được dùng model đó.
- Dùng tạm `OPENAI_MODEL=openrouter/auto` để kiểm tra.

Lỗi credit/quota

- Tài khoản OpenRouter hết credit hoặc bị giới hạn.
- Kiểm tra billing/credits trên OpenRouter.

### Lưu ý bảo mật

- Không commit `openchatbi/customer_assistant/.env`.
- Không commit `homestayManagement/src/main/resources/application-local.properties`.
- Không đặt API key trong frontend hoặc `VITE_*`.
- Nếu nghi ngờ key bị lộ, hãy revoke key trên OpenRouter và tạo key mới.
