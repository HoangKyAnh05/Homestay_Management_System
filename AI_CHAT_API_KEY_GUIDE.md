# Hướng dẫn lấy API key và chạy Customer AI Chat

Customer AI Chat gồm ba phần:

1. React frontend gọi Spring Boot tại `http://localhost:8080/api/ai/customer/chat`.
2. Spring Boot xác thực JWT, tạo context an toàn và gọi OpenChatBI sidecar.
3. Python sidecar trong `openchatbi/customer_assistant` gọi OpenAI bằng API key.

API key chỉ được đặt ở Python sidecar. Không đặt API key trong React, Git hoặc
request gửi từ trình duyệt.

## 1. Tạo OpenAI API key

1. Truy cập [OpenAI API Platform](https://platform.openai.com/).
2. Đăng nhập hoặc tạo tài khoản.
3. Tạo một Project riêng cho ứng dụng Homestay.
4. Mở trang [API Keys](https://platform.openai.com/api-keys).
5. Chọn **Create new secret key**.
6. Đặt tên, ví dụ `homestay-customer-ai`.
7. Sao chép secret key ngay khi nó được hiển thị.

OpenAI chỉ hiển thị đầy đủ secret key lúc tạo. Nếu làm mất key, hãy xóa/rotate
key cũ và tạo key mới. Xem hướng dẫn chính thức:

- [Where do I find my OpenAI API Key?](https://help.openai.com/en/articles/4936850-where-do-i-find-my-openai-api-key)
- [Developer quickstart](https://platform.openai.com/docs/quickstart)
- [API key permissions](https://help.openai.com/en/articles/8867743-assign-api-key-permissions)

> ChatGPT Plus/Pro và OpenAI API là hai dịch vụ thanh toán riêng. Kiểm tra Billing
> và Limits trong API Platform nếu nhận lỗi quota.

## 2. Tạo file môi trường cho OpenChatBI

Trong PowerShell:

```powershell
cd D:\do_an\Homestay_Management_System\openchatbi
Copy-Item customer_assistant\.env.example customer_assistant\.env
```

Mở `openchatbi/customer_assistant/.env` và điền:

```dotenv
OPENAI_API_KEY=sk-your-real-secret-key
OPENAI_MODEL=gpt-5.5
AI_INTERNAL_TOKEN=replace-with-a-long-random-secret
```

Tạo internal token ngẫu nhiên bằng PowerShell:

```powershell
([guid]::NewGuid().ToString("N") + [guid]::NewGuid().ToString("N"))
```

Sao chép kết quả vào `AI_INTERNAL_TOKEN`.

`gpt-5.5` là model mặc định theo cấu hình OpenChatBI hiện tại. Bạn có thể đổi
`OPENAI_MODEL` sang model khác mà Project của bạn được phép sử dụng. Tham khảo
[hướng dẫn model mới nhất](https://developers.openai.com/api/docs/guides/latest-model).

## 3. Cấu hình Spring Boot

Giá trị `AI_INTERNAL_TOKEN` trong Spring Boot phải giống hệt Python sidecar.

Thêm vào:

`homestayManagement/src/main/resources/application-local.properties`

```properties
AI_CUSTOMER_SERVICE_URL=http://127.0.0.1:8001
AI_INTERNAL_TOKEN=the-same-random-secret
AI_CUSTOMER_TIMEOUT_SECONDS=60
AI_CUSTOMER_RATE_LIMIT_PER_MINUTE=20
```

Không thêm `OPENAI_API_KEY` vào Spring Boot. Spring không cần biết OpenAI key.

## 4. Cài và chạy Python sidecar

Yêu cầu Python 3.11+ và `uv`.

```powershell
cd D:\do_an\Homestay_Management_System\openchatbi
uv sync
uv run uvicorn customer_assistant.app:app `
  --host 127.0.0.1 `
  --port 8001 `
  --env-file customer_assistant/.env
```

Kiểm tra:

```powershell
Invoke-RestMethod http://127.0.0.1:8001/health
```

Kết quả mong đợi:

```json
{
  "status": "UP",
  "api_key_configured": true,
  "internal_token_configured": true,
  "model": "gpt-5.5"
}
```

## 5. Chạy backend và frontend

Terminal backend:

```powershell
cd D:\do_an\Homestay_Management_System\homestayManagement
mvn spring-boot:run
```

Terminal frontend:

```powershell
cd D:\do_an\Homestay_Management_System\frontendHomestayManagement
npm run dev
```

Mở `http://localhost:5173`. Nút **AI** xuất hiện ở góc phải trên các trang
customer và không xuất hiện trong trang admin.

## 6. Quy tắc bảo mật

- Không commit `.env`, `application-local.properties` hoặc API key.
- Không đặt API key trong `VITE_*`, JavaScript hay localStorage.
- Không chụp màn hình hoặc gửi secret key qua chat/email.
- Dùng Project riêng và đặt usage limit phù hợp.
- Rotate key ngay khi nghi ngờ bị lộ.
- Production nên dùng secret manager của nền tảng deploy.
- Chỉ bind Python sidecar vào `127.0.0.1` hoặc mạng nội bộ.

## 7. Xử lý lỗi thường gặp

### `AI chat chưa được cấu hình API key`

Kiểm tra `OPENAI_API_KEY` trong `customer_assistant/.env`, sau đó khởi động lại
Python sidecar.

### `AI chat chưa được cấu hình AI_INTERNAL_TOKEN`

Kiểm tra token đã có ở cả:

- `openchatbi/customer_assistant/.env`
- `homestayManagement/src/main/resources/application-local.properties`

Hai giá trị phải giống nhau.

### Python trả `401 Invalid internal token`

Spring và Python đang dùng hai internal token khác nhau.

### Lỗi quota hoặc billing

Mở Billing và Limits trong OpenAI API Platform. ChatGPT subscription không tự
động cấp API credit.

### Đổi model

Sửa `OPENAI_MODEL` trong `.env` rồi restart Python sidecar. Không cần build lại
React hoặc Spring Boot.
