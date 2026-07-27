# HÆ°á»›ng dáº«n cáº¥u hÃ¬nh chá»©c nÄƒng AI Agent Ä‘Äƒng bÃ i

TÃ i liá»‡u nÃ y Ã¡p dá»¥ng cho thiáº¿t káº¿ má»›i:

```text
Frontend Homestay
  â†’ Backend Spring Boot
  â†’ MySQL
Them/cap nhat trong file `.env` cua backend:
  â†’ Social API tháº­t Ä‘á»ƒ Ä‘Äƒng bÃ i
```

Folder `aiagent/AiToEarn` chá»‰ dÃ¹ng Ä‘á»ƒ tham kháº£o source code/Ã½ tÆ°á»Ÿng. Há»‡ thá»‘ng khÃ´ng cáº§n cháº¡y Docker, khÃ´ng cáº§n MongoDB, khÃ´ng cáº§n Redis, khÃ´ng cáº§n AiToEarn online.

## 1. Vai trÃ² cÃ¡c folder

| Folder | Vai trÃ² |
|---|---|
| `frontendHomestayManagement` | Giao diá»‡n marketing/admin |
| `homestayManagement` | Backend chÃ­nh: AI viáº¿t bÃ i, OAuth social, lÆ°u MySQL, Ä‘Äƒng social |
| `openchatbi` | Chat box AI tÆ° váº¥n khÃ¡ch hÃ ng/admin |
| `aiagent/AiToEarn` | Chá»‰ tham kháº£o source code, khÃ´ng pháº£i service runtime |

## 2. Chá»‰ cáº§n cháº¡y gÃ¬?

Báº¡n chá»‰ cáº§n cháº¡y:

```text
1. MySQL
2. Backend Spring Boot
3. Frontend React/Vite
```

KhÃ´ng cáº§n cháº¡y:

```text
Docker
MongoDB
Redis
AiToEarn online
aiagent/homestay-marketing-agent
```

## 3. Cáº¥u hÃ¬nh Backend Spring Boot

Trong `.env` cá»§a backend:

```env
MARKETING_AI_ENABLED=true
MARKETING_AI_PROVIDER=openai
MARKETING_AI_API_KEY=sk-proj-your-openai-api-key
MARKETING_AI_BASE_URL=https://api.openai.com/v1
MARKETING_AI_CHAT_PATH=/chat/completions
- `MARKETING_AI_MODEL=gpt-4.1-mini`: model dung de viet noi dung. Co the doi sang `gpt-5.1` neu project OpenAI co quyen.
MARKETING_AI_COMPATIBILITY_MODE=openai
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

- `MARKETING_AI_API_KEY`: API key do OpenAI cap.

- `MARKETING_AI_BASE_URL`: endpoint OpenAI, mac dinh `https://api.openai.com/v1`.

`MARKETING_AI_CHAT_PATH` mac dinh la `/chat/completions`.

`MARKETING_AI_MODEL` mac dinh la `gpt-4.1-mini`. Co the doi sang `gpt-5.1` neu project OpenAI co quyen.

- `MARKETING_AI_COMPATIBILITY_MODE=openai`: backend gui payload phu hop OpenAI.

Náº¿u quay láº¡i OpenAI trá»±c tiáº¿p, dÃ¹ng:

```env
MARKETING_AI_PROVIDER=openai
MARKETING_AI_API_KEY=sk-proj-your-openai-api-key
MARKETING_AI_BASE_URL=https://api.openai.com/v1
MARKETING_AI_CHAT_PATH=/chat/completions
- `MARKETING_AI_MODEL=gpt-4.1-mini`: model dung de viet noi dung. Co the doi sang `gpt-5.1` neu project OpenAI co quyen.
MARKETING_AI_COMPATIBILITY_MODE=openai
MARKETING_AI_AUTH_HEADER_NAME=Authorization
MARKETING_AI_AUTH_HEADER_PREFIX=Bearer
```

Social token khÃ´ng nháº­p tay trong giao diá»‡n; backend láº¥y qua OAuth vÃ  lÆ°u vÃ o MySQL.

## 4. Cáº¥u hÃ¬nh Facebook Developer

Trong Facebook Developer Console, redirect URI pháº£i trÃ¹ng:

```text
http://localhost:8080/api/marketing/social/oauth/callback
```

Quyá»n cáº§n xin tá»‘i thiá»ƒu:

```text
pages_show_list
pages_read_engagement
pages_manage_posts
```

Sau khi cáº¥u hÃ¬nh `.env`, khi backend khá»Ÿi Ä‘á»™ng, há»‡ thá»‘ng tá»± seed/cáº­p nháº­t báº£ng `social_oauth_apps` cho Facebook.

## 5. Luá»“ng káº¿t ná»‘i page social

TrÃªn giao diá»‡n:

1. VÃ o `Marketing & AI Agent â†’ AI Agent ÄÄƒng bÃ i`.
2. á»ž pháº§n `Káº¿t ná»‘i page social vÃ o thÆ° viá»‡n`, chá»n Facebook.
3. Báº¥m `Káº¿t ná»‘i social`.
4. Spring Boot tá»± táº¡o OAuth URL.
5. ÄÄƒng nháº­p Facebook vÃ  cáº¥p quyá»n.
6. Facebook callback vá» Spring Boot.
7. Backend Ä‘á»•i `code` láº¥y token, láº¥y danh sÃ¡ch page, lÆ°u vÃ o MySQL `social_accounts`.
8. Quay láº¡i giao diá»‡n, báº¥m `Táº£i tÃ i khoáº£n Ä‘Ã£ káº¿t ná»‘i` hoáº·c `Kiá»ƒm tra káº¿t ná»‘i`.
9. Chá»n page trong pháº§n `KÃªnh & page Ä‘Äƒng bÃ i`.

## 6. Luá»“ng táº¡o vÃ  Ä‘Äƒng bÃ i

```text
NhÃ¢n viÃªn nháº­p brief
â†’ Backend gá»i AI Provider Ä‘ang cáº¥u hÃ¬nh
â†’ Backend lÆ°u bÃ i vÃ o MySQL
â†’ NhÃ¢n viÃªn báº¥m ÄÄƒng ngay
â†’ Backend láº¥y token page trong MySQL
â†’ Backend gá»i Facebook Graph API
â†’ Backend lÆ°u external_post_id/external_url/log vÃ o MySQL
```

## 7. Database MySQL chÃ­nh

CÃ¡c báº£ng quan trá»ng:

| Báº£ng | Má»¥c Ä‘Ã­ch |
|---|---|
| `social_oauth_apps` | LÆ°u app OAuth theo platform |
| `social_oauth_sessions` | LÆ°u phiÃªn káº¿t ná»‘i social/OAuth state |
| `social_accounts` | LÆ°u page/account, token, external account id |
| `marketing_posts` | BÃ i viáº¿t cha |
| `marketing_post_channels` | Ná»™i dung/tráº¡ng thÃ¡i theo tá»«ng page |
| `marketing_publish_attempts` | Log má»—i láº§n Ä‘Äƒng |
| `ai_generation_logs` | Log má»—i láº§n gá»i AI viáº¿t bÃ i |

## 8. LÆ°u Ã½ hiá»‡n táº¡i

- ÄÄƒng trá»±c tiáº¿p Facebook Page Ä‘Ã£ cÃ³ khung xá»­ lÃ½ trong Spring Boot.
- Instagram/TikTok/LinkedIn cáº§n bá»• sung publish API riÃªng theo chÃ­nh sÃ¡ch tá»«ng ná»n táº£ng.
- KhÃ´ng nháº­p `External Account ID` thá»§ cÃ´ng ná»¯a.
- KhÃ´ng nháº­p access token thá»§ cÃ´ng ná»¯a.
- AiToEarn chá»‰ cÃ²n lÃ  tÃ i liá»‡u tham kháº£o, khÃ´ng cÃ²n lÃ  dependency runtime.


