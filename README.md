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
├── frontendHomestayManagement/      # Frontend React + Vite
│   └── src/
│       ├── components/              # Các component dùng chung
│       ├── pages/                   # Các trang (Home, Login, Register, Profile, ForgotPassword)
│       └── services/                # Toàn bộ API calls
│
├── openchatbi/                      # AI chat box tư vấn khách hàng/admin
│   └── customer_assistant/          # FastAPI sidecar cho chat box
│
└── aiagent/                         # Source tham khảo AiToEarn, không phải runtime chính
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

## Hệ thống AI hiện có

Website hiện có 2 chức năng AI riêng biệt:

| Chức năng AI | Vị trí sử dụng | Folder chính | Vai trò |
|---|---|---|---|
| AI Chat Box | Trang chủ khách hàng và khu admin | `openchatbi/customer_assistant` + backend Spring Boot | Tư vấn khách hàng/admin qua hộp chat |
| AI Agent viết bài Marketing | `Marketing & AI Agent → AI Agent Đăng bài` | `homestayManagement` | Sinh nội dung bài đăng, lưu MySQL, lên lịch và đăng social |

Lưu ý quan trọng:

- API key AI không đặt trong frontend.
- Frontend chỉ gọi backend Spring Boot.
- Backend Spring Boot chịu trách nhiệm bảo vệ token, gọi AI provider và lưu log.
- Folder `aiagent/AiToEarn` hiện chỉ dùng để tham khảo source/ý tưởng, không bắt buộc chạy Docker, MongoDB hay Redis.

---

## AI số 1 — Hướng dẫn setup AI Chat Box bằng OpenRouter

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

---

## AI số 2 — Hướng dẫn setup AI Agent viết nội dung đăng bài

AI Agent đăng bài nằm trong menu:

```text
Admin → Marketing & AI Agent → AI Agent Đăng bài
```

Chức năng chính:

1. Nhân viên marketing nhập tiêu đề, mục tiêu, giọng điệu, brief và ảnh/video.
2. Backend Spring Boot gọi AI provider để sinh nội dung bài viết.
3. Nội dung được lưu vào MySQL.
4. Nhân viên có thể sửa nội dung đề xuất trước khi đăng.
5. Nhân viên có thể bấm `Đăng ngay` hoặc `Lên lịch`.
6. Nếu đã lên lịch, backend tự quét bài đến giờ và tự đăng.
7. Nhật ký bài đăng lưu trạng thái, nội dung, lỗi nếu có và link bài đã đăng.

### Kiến trúc AI Marketing

```text
Frontend React
  → Backend Spring Boot
  → MySQL
  → AI Provider viết nội dung: OpenAI hoặc FPT Marketplace GLM-5.2
  → Facebook Graph API để đăng bài thật
```

Backend Spring Boot là nơi gọi AI và gọi social API. Frontend không gọi trực tiếp AI provider hoặc Facebook Graph API.

### Cấu hình backend cho AI viết nội dung

Dự án đang hỗ trợ cấu hình linh hoạt qua các biến `MARKETING_AI_*`.

Nếu muốn test FPT Marketplace GLM-5.2, thêm/cập nhật trong file `.env` của backend:

```env
MARKETING_AI_ENABLED=true
MARKETING_AI_PROVIDER=fpt
MARKETING_AI_API_KEY=your_fpt_marketplace_api_key
MARKETING_AI_BASE_URL=https://your-fpt-marketplace-endpoint/v1
MARKETING_AI_CHAT_PATH=/chat/completions
MARKETING_AI_MODEL=GLM-5.2
MARKETING_AI_COMPATIBILITY_MODE=generic
MARKETING_AI_AUTH_HEADER_NAME=Authorization
MARKETING_AI_AUTH_HEADER_PREFIX=Bearer
```

Giải thích nhanh:

- `MARKETING_AI_PROVIDER=fpt`: đánh dấu provider đang test là FPT.
- `MARKETING_AI_API_KEY`: API key do FPT Marketplace cấp.
- `MARKETING_AI_BASE_URL`: endpoint do FPT Marketplace cấp cho model GLM-5.2.
- `MARKETING_AI_CHAT_PATH`: path gọi chat completion. Mặc định là `/chat/completions`.
- `MARKETING_AI_MODEL=GLM-5.2`: model dùng để viết nội dung.
- `MARKETING_AI_COMPATIBILITY_MODE=generic`: backend chỉ gửi payload cơ bản để tránh lỗi không tương thích tham số.

Nếu quay lại OpenAI trực tiếp:

```env
MARKETING_AI_ENABLED=true
MARKETING_AI_PROVIDER=openai
MARKETING_AI_API_KEY=sk-proj-your-openai-api-key
MARKETING_AI_BASE_URL=https://api.openai.com/v1
MARKETING_AI_CHAT_PATH=/chat/completions
MARKETING_AI_MODEL=gpt-5.5
MARKETING_AI_COMPATIBILITY_MODE=openai
MARKETING_AI_AUTH_HEADER_NAME=Authorization
MARKETING_AI_AUTH_HEADER_PREFIX=Bearer
```

### Cấu hình Facebook để đăng bài thật

Để AI Agent đăng bài lên Facebook Page thật, backend cần Facebook OAuth app:

```env
MARKETING_SOCIAL_FACEBOOK_CLIENT_ID=your_facebook_app_id
MARKETING_SOCIAL_FACEBOOK_CLIENT_SECRET=your_facebook_app_secret
MARKETING_SOCIAL_FACEBOOK_REDIRECT_URI=http://localhost:8080/api/marketing/social/oauth/callback
MARKETING_SOCIAL_FACEBOOK_SCOPES=pages_show_list,pages_read_engagement,pages_manage_posts
```

Trong Facebook Developer Console, redirect URI phải trùng:

```text
http://localhost:8080/api/marketing/social/oauth/callback
```

Sau khi cấu hình xong:

1. Chạy backend.
2. Vào `Marketing & AI Agent → AI Agent Đăng bài`.
3. Bấm `Kết nối social`.
4. Đăng nhập Facebook và cấp quyền.
5. Quay lại giao diện, bấm `Tải tài khoản đã kết nối`.
6. Chọn Page ở phần `Kênh & page đăng bài`.

Social token sẽ được backend lấy qua OAuth và lưu vào MySQL, không nhập tay trên giao diện.

### Tự động đăng bài đã lên lịch

Backend có scheduler tự động đăng các bài đã lên lịch:

```properties
MARKETING_SCHEDULER_ENABLED=true
MARKETING_SCHEDULER_PUBLISH_FIXED_DELAY_MS=5000
```

Luồng hoạt động:

```text
Nhân viên bấm Lên lịch
→ Backend lưu scheduledAt và status = SCHEDULED
→ Scheduler quét định kỳ các bài đến giờ
→ Backend gọi publishChannel()
→ Đăng Facebook Page thật
→ Nếu thành công: status = PUBLISHED, lưu postedAt/externalUrl
→ Nếu lỗi: status = FAILED, lưu errorMessage và publish attempt
```

Mặc định scheduler quét mỗi 5 giây, nên bài hẹn giờ sẽ được đăng gần như đúng thời điểm đã chọn.

### Các bảng MySQL liên quan AI Marketing

| Bảng | Mục đích |
|---|---|
| `marketing_posts` | Lưu bài viết cha |
| `marketing_post_channels` | Lưu nội dung/trạng thái theo từng page/kênh |
| `marketing_post_media` | Lưu ảnh/video gắn với bài đăng |
| `marketing_publish_attempts` | Lưu log mỗi lần đăng social |
| `ai_generation_logs` | Lưu log mỗi lần gọi AI viết nội dung |
| `social_oauth_apps` | Lưu cấu hình OAuth app |
| `social_oauth_sessions` | Lưu phiên OAuth |
| `social_accounts` | Lưu page/account đã kết nối |

### Lỗi thường gặp với AI Marketing

`Marketing AI trả về HTTP 429`

- Provider đang giới hạn quota/rate limit.
- Kiểm tra billing/credit/API quota.
- Thử model nhẹ hơn hoặc đợi một lúc rồi gọi lại.

`Marketing AI trả về HTTP 401/403`

- API key sai hoặc provider không cho phép dùng model.
- Kiểm tra `MARKETING_AI_API_KEY`, `MARKETING_AI_MODEL`, quyền project/tài khoản.

`Marketing AI trả về HTTP 400`

- Endpoint hoặc payload không tương thích.
- Với FPT/GLM, dùng `MARKETING_AI_COMPATIBILITY_MODE=generic`.
- Kiểm tra lại `MARKETING_AI_BASE_URL` và `MARKETING_AI_CHAT_PATH`.

`Chưa gán page/tài khoản social để đăng bài`

- Chưa chọn Page trong phần `Kênh & page đăng bài`.
- Bấm `Tải tài khoản đã kết nối`, chọn Page rồi tạo/lên lịch lại bài.

`Page chưa có access token`

- Kết nối Facebook OAuth chưa thành công hoặc token hết hạn.
- Bấm `Kết nối social` lại để backend lấy token mới.

### Tài liệu chi tiết hơn

Xem thêm file:

```text
AI_AGENT_CONFIGURATION_GUIDE.md
```
