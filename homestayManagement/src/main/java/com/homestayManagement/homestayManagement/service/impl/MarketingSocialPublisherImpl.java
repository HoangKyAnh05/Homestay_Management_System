package com.homestayManagement.homestayManagement.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.homestayManagement.homestayManagement.entity.MarketingPostChannel;
import com.homestayManagement.homestayManagement.entity.MarketingPostMedia;
import com.homestayManagement.homestayManagement.entity.SocialAccount;
import com.homestayManagement.homestayManagement.repository.MarketingPostMediaRepository;
import com.homestayManagement.homestayManagement.service.MarketingSocialPublisher;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class MarketingSocialPublisherImpl implements MarketingSocialPublisher {

    private final boolean enabled;
    private final String apiBaseUrl;
    private final String apiKey;
    private final Duration timeout;
    private final ObjectMapper objectMapper;
    private final MarketingPostMediaRepository mediaRepository;
    private final HttpClient httpClient;

    public MarketingSocialPublisherImpl(
            @Value("${marketing.aitoearn.enabled:false}") boolean enabled,
            @Value("${marketing.aitoearn.api-base-url:}") String apiBaseUrl,
            @Value("${marketing.aitoearn.api-key:}") String apiKey,
            @Value("${marketing.aitoearn.timeout-seconds:45}") long timeoutSeconds,
            ObjectMapper objectMapper,
            MarketingPostMediaRepository mediaRepository
    ) {
        this.enabled = enabled;
        this.apiBaseUrl = trimTrailingSlash(apiBaseUrl);
        this.apiKey = apiKey;
        this.timeout = Duration.ofSeconds(timeoutSeconds);
        this.objectMapper = objectMapper;
        this.mediaRepository = mediaRepository;
        this.httpClient = HttpClient.newBuilder().connectTimeout(this.timeout).build();
    }

    @Override
    public PublishResult publish(MarketingPostChannel channel) {
        SocialAccount account = channel.getSocialAccount();
        if (account == null) {
            return failed("SOCIAL_ACCOUNT_REQUIRED", "Chưa gán page/tài khoản social để đăng bài.");
        }

        if (!enabled) {
            return failed(
                    "AITOEARN_DISABLED",
                    "Legacy AiToEarn relay chưa bật. Luồng mới nên dùng MARKETING_AIAGENT_ENABLED=true và AITOEARN_SERVER_BASE_URL trong aiagent/homestay-marketing-agent/.env."
            );
        }
        if (!hasText(apiBaseUrl) || !hasText(apiKey)) {
            return failed("AITOEARN_CONFIG_MISSING", "Thiếu API base URL hoặc API key của AiToEarn relay.");
        }
        if (!hasText(account.getExternalAccountId())) {
            return failed(
                    "AITOEARN_ACCOUNT_ID_REQUIRED",
                    "Social account cần externalAccountId là accountId đã bind trong AiToEarn."
            );
        }

        try {
            Map<String, Object> payload = buildPublishFlowPayload(channel, account);
            String requestJson = objectMapper.writeValueAsString(payload);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(apiBaseUrl + "/v2/channels/publish/flows"))
                    .timeout(timeout)
                    .header("Content-Type", "application/json")
                    .header("x-api-key", apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(requestJson))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                return new PublishResult(
                        false,
                        "FAILED",
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        response.body(),
                        "AITOEARN_HTTP_" + response.statusCode(),
                        "AiToEarn relay trả về HTTP " + response.statusCode()
                );
            }
            return toPublishResult(response.body());
        } catch (IOException exception) {
            return failed("AITOEARN_IO_ERROR", "Không thể gọi AiToEarn relay: " + exception.getMessage());
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            return failed("AITOEARN_INTERRUPTED", "Tác vụ đăng bài bị gián đoạn.");
        } catch (RuntimeException exception) {
            return failed("AITOEARN_CLIENT_ERROR", "Không thể tạo publish flow: " + exception.getMessage());
        }
    }

    private Map<String, Object> buildPublishFlowPayload(MarketingPostChannel channel, SocialAccount account) {
        List<MarketingPostMedia> media = mediaRepository.findByPostIdOrderByDisplayOrderAsc(channel.getPost().getId());
        List<Map<String, Object>> mediaPayload = new ArrayList<>();
        for (MarketingPostMedia item : media) {
            mediaPayload.add(Map.of("url", item.getMediaUrl()));
        }

        Map<String, Object> content = new LinkedHashMap<>();
        content.put("title", channel.getPost().getTitle());
        content.put("body", channel.getContent());
        content.put("media", mediaPayload);
        if (!mediaPayload.isEmpty()) {
            content.put("cover", mediaPayload.getFirst());
        }

        Map<String, Object> context = new LinkedHashMap<>();
        context.put("source", "api");
        context.put("taskId", "HMS-MKT-" + channel.getId());
        context.put("type", media.stream().anyMatch(item -> "VIDEO".equalsIgnoreCase(item.getMediaType())) ? "VIDEO" : "ImageText");
        context.put("materialId", channel.getPost().getId().toString());

        Map<String, Object> item = new LinkedHashMap<>();
        item.put("accountId", account.getExternalAccountId());
        item.put("platform", toAiToEarnPlatform(channel.getPlatform()));
        item.put("option", parseOption(channel.getPlatformOptionJson()));

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("flowId", "hms-marketing-" + channel.getId() + "-" + System.currentTimeMillis());
        payload.put("content", content);
        payload.put("publishAt", publishAt(channel));
        payload.put("context", context);
        payload.put("items", List.of(item));
        return payload;
    }

    private PublishResult toPublishResult(String responseBody) throws JsonProcessingException {
        JsonNode root = objectMapper.readTree(responseBody);
        JsonNode data = root.has("data") ? root.get("data") : root;
        String flowId = text(data, "flowId");
        JsonNode task = data.path("tasks").isArray() && !data.path("tasks").isEmpty()
                ? data.path("tasks").get(0)
                : data;
        String taskId = firstText(task, "id", "taskId");
        String status = mapAiToEarnStatus(firstText(task, "status"));
        String platformWorkId = firstText(task, "platformWorkId", "dataId");
        String workLink = firstText(task, "workLink", "externalUrl");
        String errorMsg = firstText(task, "errorMsg", "errorMessage");
        boolean success = errorMsg == null || errorMsg.isBlank();
        return new PublishResult(
                success,
                success ? status : "FAILED",
                null,
                null,
                flowId,
                taskId,
                platformWorkId,
                workLink,
                responseBody,
                success ? null : "AITOEARN_TASK_FAILED",
                errorMsg
        );
    }

    private Map<String, Object> parseOption(String json) {
        if (!hasText(json)) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(json, Map.class);
        } catch (JsonProcessingException exception) {
            return Map.of("rawOption", json);
        }
    }

    private String publishAt(MarketingPostChannel channel) {
        LocalDateTime value = channel.getScheduledAt() == null ? LocalDateTime.now() : channel.getScheduledAt();
        return value.atOffset(ZoneOffset.ofHours(7)).toString();
    }

    private String mapAiToEarnStatus(String value) {
        if (!hasText(value)) {
            return "PUBLISHING";
        }
        String normalized = value.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case "-1", "FAIL", "FAILED" -> "FAILED";
            case "1", "RELEASED", "PUBLISHED" -> "PUBLISHED";
            case "6", "QUEUED" -> "QUEUED";
            case "7", "PLATFORM_SCHEDULED", "SCHEDULED" -> "SCHEDULED";
            case "8", "WAITING_FOR_USER_ACTION" -> "WAITING_FOR_USER_ACTION";
            default -> "PUBLISHING";
        };
    }

    private String toAiToEarnPlatform(String platform) {
        if (platform == null) {
            return "";
        }
        return switch (platform.trim().toUpperCase(Locale.ROOT)) {
            case "FACEBOOK" -> "facebook";
            case "INSTAGRAM" -> "instagram";
            case "TIKTOK" -> "tiktok";
            case "YOUTUBE" -> "youtube";
            case "LINKEDIN" -> "linkedin";
            case "PINTEREST" -> "pinterest";
            case "THREADS" -> "threads";
            case "TWITTER", "X" -> "twitter";
            default -> platform.trim().toLowerCase(Locale.ROOT);
        };
    }

    private PublishResult failed(String code, String message) {
        return new PublishResult(false, "FAILED", null, null, null, null, null, null, null, code, message);
    }

    private String text(JsonNode node, String field) {
        JsonNode value = node.get(field);
        return value == null || value.isNull() ? null : value.asText();
    }

    private String firstText(JsonNode node, String... fields) {
        for (String field : fields) {
            String value = text(node, field);
            if (hasText(value)) {
                return value;
            }
        }
        return null;
    }

    private static String trimTrailingSlash(String value) {
        if (value == null) {
            return "";
        }
        return value.replaceAll("/+$", "");
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
