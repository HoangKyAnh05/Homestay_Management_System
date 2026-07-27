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
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class MarketingAiAgentPublisherImpl implements MarketingSocialPublisher {

    private final boolean enabled;
    private final String baseUrl;
    private final String authToken;
    private final String publishPath;
    private final Duration timeout;
    private final ObjectMapper objectMapper;
    private final MarketingPostMediaRepository mediaRepository;
    private final HttpClient httpClient;

    public MarketingAiAgentPublisherImpl(
            @Value("${marketing.aiagent.enabled:false}") boolean enabled,
            @Value("${marketing.aiagent.base-url:}") String baseUrl,
            @Value("${marketing.aiagent.auth-token:}") String authToken,
            @Value("${marketing.aiagent.publish-path:/api/homestay/marketing/publish}") String publishPath,
            @Value("${marketing.aiagent.timeout-seconds:90}") long timeoutSeconds,
            ObjectMapper objectMapper,
            MarketingPostMediaRepository mediaRepository
    ) {
        this.enabled = enabled;
        this.baseUrl = trimTrailingSlash(baseUrl);
        this.authToken = authToken;
        this.publishPath = normalizePath(publishPath);
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
            return failed("AIAGENT_DISABLED", "Chưa bật Marketing AI Agent. Hãy cấu hình MARKETING_AIAGENT_ENABLED=true.");
        }
        if (!hasText(baseUrl) || !hasText(authToken)) {
            return failed("AIAGENT_CONFIG_MISSING", "Thiếu MARKETING_AIAGENT_BASE_URL hoặc MARKETING_AIAGENT_AUTH_TOKEN.");
        }
        if (!hasText(account.getExternalAccountId())) {
            return failed("AIAGENT_ACCOUNT_ID_REQUIRED", "Social account cần externalAccountId là accountId đã bind trong AiToEarn.");
        }

        try {
            String requestJson = objectMapper.writeValueAsString(buildPayload(channel, account));
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + publishPath))
                    .timeout(timeout)
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + authToken)
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
                        "AIAGENT_HTTP_" + response.statusCode(),
                        "Marketing AI Agent trả về HTTP " + response.statusCode()
                );
            }
            return toPublishResult(response.body());
        } catch (IOException exception) {
            return failed("AIAGENT_IO_ERROR", "Không thể gọi Marketing AI Agent: " + exception.getMessage());
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            return failed("AIAGENT_INTERRUPTED", "Tác vụ đăng bài bị gián đoạn.");
        } catch (RuntimeException exception) {
            return failed("AIAGENT_CLIENT_ERROR", "Không thể tạo yêu cầu đăng bài: " + exception.getMessage());
        }
    }

    private Map<String, Object> buildPayload(MarketingPostChannel channel, SocialAccount account) {
        Map<String, Object> post = new LinkedHashMap<>();
        post.put("id", channel.getPost().getId());
        post.put("title", channel.getPost().getTitle());
        post.put("brief", channel.getPost().getBrief());
        post.put("targetAudience", channel.getPost().getTargetAudience());
        post.put("goal", channel.getPost().getGoal());
        post.put("tone", channel.getPost().getTone());

        Map<String, Object> channelPayload = new LinkedHashMap<>();
        channelPayload.put("id", channel.getId());
        channelPayload.put("platform", channel.getPlatform());
        channelPayload.put("pageName", channel.getPageName());
        channelPayload.put("pageUrl", channel.getPageUrl());
        channelPayload.put("content", channel.getContent());
        channelPayload.put("hashtags", channel.getHashtags());
        channelPayload.put("platformOptionJson", channel.getPlatformOptionJson());
        channelPayload.put("scheduledAt", channel.getScheduledAt() == null ? null : channel.getScheduledAt().toString());

        Map<String, Object> socialAccount = new LinkedHashMap<>();
        socialAccount.put("id", account.getId());
        socialAccount.put("platform", account.getPlatform());
        socialAccount.put("accountName", account.getAccountName());
        socialAccount.put("pageUrl", account.getPageUrl());
        socialAccount.put("externalAccountId", account.getExternalAccountId());

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("source", "homestay-management");
        payload.put("taskId", "HMS-MKT-" + channel.getId());
        payload.put("post", post);
        payload.put("channel", channelPayload);
        payload.put("socialAccount", socialAccount);
        payload.put("media", mediaRepository.findByPostIdOrderByDisplayOrderAsc(channel.getPost().getId()).stream().map(this::toMediaPayload).toList());
        return payload;
    }

    private Map<String, Object> toMediaPayload(MarketingPostMedia media) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("id", media.getId());
        payload.put("url", media.getMediaUrl());
        payload.put("type", media.getMediaType());
        payload.put("altText", media.getAltText());
        payload.put("source", media.getSource());
        return payload;
    }

    private PublishResult toPublishResult(String responseBody) throws JsonProcessingException {
        JsonNode root = objectMapper.readTree(responseBody);
        JsonNode data = root.has("data") ? root.get("data") : root;
        boolean success = !data.has("success") || data.path("success").asBoolean(true);
        String status = firstText(data, "status");
        return new PublishResult(
                success,
                success ? (hasText(status) ? status : "PUBLISHING") : "FAILED",
                firstText(data, "generatedContent", "content"),
                firstText(data, "generatedHashtags", "hashtags"),
                firstText(data, "flowId", "relayFlowId"),
                firstText(data, "taskId", "relayTaskId"),
                firstText(data, "externalPostId", "platformWorkId", "dataId"),
                firstText(data, "externalUrl", "workLink"),
                responseBody,
                success ? null : firstText(data, "errorCode", "code"),
                success ? null : firstText(data, "errorMessage", "message")
        );
    }

    private PublishResult failed(String code, String message) {
        return new PublishResult(false, "FAILED", null, null, null, null, null, null, null, code, message);
    }

    private String firstText(JsonNode node, String... fields) {
        for (String field : fields) {
            JsonNode value = node.get(field);
            if (value != null && !value.isNull() && hasText(value.asText())) {
                return value.asText();
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

    private static String normalizePath(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        return value.startsWith("/") ? value : "/" + value;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
