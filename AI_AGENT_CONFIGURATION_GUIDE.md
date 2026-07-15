# Hướng dẫn cấu hình chức năng AI Agent đăng bài

Tài liệu này áp dụng cho thiết kế mới:

```text
Frontend Homestay
  → Backend Spring Boot
  → MySQL
  → AI Provider để viết nội dung: OpenAI hoặc FPT Marketplace GLM-5.2
  → Social API thật để đăng bài
```

Folder `aiagent/AiToEarn` chỉ dùng để tham khảo source code/ý tưởng. Hệ thống không cần chạy Docker, không cần MongoDB, không cần Redis, không cần AiToEarn online.

## 1. Vai trò các folder

| Folder | Vai trò |
|---|---|
| `frontendHomestayManagement` | Giao diện marketing/admin |
| `homestayManagement` | Backend chính: AI viết bài, OAuth social, lưu MySQL, đăng social |
| `openchatbi` | Chat box AI tư vấn khách hàng/admin |
| `aiagent/AiToEarn` | Chỉ tham khảo source code, không phải service runtime |

## 2. Chỉ cần chạy gì?

Bạn chỉ cần chạy:

```text
1. MySQL
2. Backend Spring Boot
3. Frontend React/Vite
```

Không cần chạy:

```text
Docker
MongoDB
Redis
AiToEarn online
aiagent/homestay-marketing-agent
```

## 3. Cấu hình Backend Spring Boot

Trong `.env` của backend:

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

MARKETING_OPENROUTER_ENABLED=false

MARKETING_SOCIAL_FACEBOOK_CLIENT_ID=your_facebook_app_id
MARKETING_SOCIAL_FACEBOOK_CLIENT_SECRET=your_facebook_app_secret
MARKETING_SOCIAL_FACEBOOK_REDIRECT_URI=http://localhost:8080/api/marketing/social/oauth/callback
MARKETING_SOCIAL_FACEBOOK_SCOPES=pages_show_list,pages_read_engagement,pages_manage_posts

MARKETING_AIAGENT_ENABLED=false
MARKETING_AIAGENT_SIDECAR_AUTO_START=false
MARKETING_AITOEARN_LOCAL_AUTO_START=false
```

`MARKETING_AI_API_KEY` là API key của provider đang dùng để AI viết bài. Nếu test FPT Marketplace, lấy key trong trang sản phẩm/API key của FPT Marketplace.

`MARKETING_AI_BASE_URL` là base URL do provider cấp. Với FPT Marketplace, hãy copy endpoint được FPT cấp cho GLM-5.2. Nếu endpoint FPT đã bao gồm `/v1`, giữ nguyên như FPT cung cấp; nếu không có `/v1` thì không tự thêm bừa, hãy dùng đúng URL trong tài liệu/API detail của FPT.

`MARKETING_AI_CHAT_PATH` mặc định là `/chat/completions`. Nếu FPT Marketplace cấp path khác, đổi biến này theo đúng tài liệu FPT.

`MARKETING_AI_MODEL` đặt là `GLM-5.2` khi test GLM-5.2. Nếu FPT yêu cầu model id viết thường hoặc có tiền tố khác, hãy sửa đúng theo model id FPT hiển thị.

`MARKETING_AI_COMPATIBILITY_MODE=generic` giúp backend chỉ gửi payload cơ bản `model/messages/temperature`, tránh gửi các tham số riêng của OpenAI như `reasoning_effort`, `seed`, `presence_penalty`, `frequency_penalty`.

Nếu quay lại OpenAI trực tiếp, dùng:

```env
MARKETING_AI_PROVIDER=openai
MARKETING_AI_API_KEY=sk-proj-your-openai-api-key
MARKETING_AI_BASE_URL=https://api.openai.com/v1
MARKETING_AI_CHAT_PATH=/chat/completions
MARKETING_AI_MODEL=gpt-5.5
MARKETING_AI_COMPATIBILITY_MODE=openai
MARKETING_AI_AUTH_HEADER_NAME=Authorization
MARKETING_AI_AUTH_HEADER_PREFIX=Bearer
```

Social token không nhập tay trong giao diện; backend lấy qua OAuth và lưu vào MySQL.

## 4. Cấu hình Facebook Developer

Trong Facebook Developer Console, redirect URI phải trùng:

```text
http://localhost:8080/api/marketing/social/oauth/callback
```

Quyền cần xin tối thiểu:

```text
pages_show_list
pages_read_engagement
pages_manage_posts
```

Sau khi cấu hình `.env`, khi backend khởi động, hệ thống tự seed/cập nhật bảng `social_oauth_apps` cho Facebook.

## 5. Luồng kết nối page social

Trên giao diện:

1. Vào `Marketing & AI Agent → AI Agent Đăng bài`.
2. Ở phần `Kết nối page social vào thư viện`, chọn Facebook.
3. Bấm `Kết nối social`.
4. Spring Boot tự tạo OAuth URL.
5. Đăng nhập Facebook và cấp quyền.
6. Facebook callback về Spring Boot.
7. Backend đổi `code` lấy token, lấy danh sách page, lưu vào MySQL `social_accounts`.
8. Quay lại giao diện, bấm `Tải tài khoản đã kết nối` hoặc `Kiểm tra kết nối`.
9. Chọn page trong phần `Kênh & page đăng bài`.

## 6. Luồng tạo và đăng bài

```text
Nhân viên nhập brief
→ Backend gọi AI Provider đang cấu hình
→ Backend lưu bài vào MySQL
→ Nhân viên bấm Đăng ngay
→ Backend lấy token page trong MySQL
→ Backend gọi Facebook Graph API
→ Backend lưu external_post_id/external_url/log vào MySQL
```

## 7. Database MySQL chính

Các bảng quan trọng:

| Bảng | Mục đích |
|---|---|
| `social_oauth_apps` | Lưu app OAuth theo platform |
| `social_oauth_sessions` | Lưu phiên kết nối social/OAuth state |
| `social_accounts` | Lưu page/account, token, external account id |
| `marketing_posts` | Bài viết cha |
| `marketing_post_channels` | Nội dung/trạng thái theo từng page |
| `marketing_publish_attempts` | Log mỗi lần đăng |
| `ai_generation_logs` | Log mỗi lần gọi AI viết bài |

## 8. Lưu ý hiện tại

- Đăng trực tiếp Facebook Page đã có khung xử lý trong Spring Boot.
- Instagram/TikTok/LinkedIn cần bổ sung publish API riêng theo chính sách từng nền tảng.
- Không nhập `External Account ID` thủ công nữa.
- Không nhập access token thủ công nữa.
- AiToEarn chỉ còn là tài liệu tham khảo, không còn là dependency runtime.
