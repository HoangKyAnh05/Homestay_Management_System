package com.homestayManagement.homestayManagement.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.homestayManagement.homestayManagement.dto.request.MarketingPostRequest;
import com.homestayManagement.homestayManagement.service.MarketingAiTextGenerator;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class MarketingAiTextGeneratorImpl implements MarketingAiTextGenerator {

    private final boolean enabled;
    private final String apiKey;
    private final String baseUrl;
    private final String model;
    private final Duration timeout;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public MarketingAiTextGeneratorImpl(
            @Value("${marketing.openrouter.enabled:true}") boolean enabled,
            @Value("${marketing.openrouter.api-key:}") String apiKey,
            @Value("${marketing.openrouter.base-url:https://openrouter.ai/api/v1}") String baseUrl,
            @Value("${marketing.openrouter.model:openai/gpt-4o-mini}") String model,
            @Value("${marketing.openrouter.timeout-seconds:60}") long timeoutSeconds,
            ObjectMapper objectMapper
    ) {
        this.enabled = enabled;
        this.apiKey = apiKey;
        this.baseUrl = trimTrailingSlash(baseUrl);
        this.model = model;
        this.timeout = Duration.ofSeconds(Math.max(5, timeoutSeconds));
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder().connectTimeout(this.timeout).build();
    }

    @Override
    public GenerationResult generate(MarketingPostRequest request) {
        if (!enabled) {
            return failed("OPENROUTER_DISABLED", "Chưa bật OpenRouter cho Marketing AI.");
        }
        if (!hasText(apiKey)) {
            return failed("OPENROUTER_KEY_MISSING", "Thiếu MARKETING_OPENROUTER_API_KEY.");
        }

        try {
            String variationSeed = UUID.randomUUID().toString();
            String prompt = """
                    Bạn là AI marketing cho homestay. Hãy viết nội dung đăng mạng xã hội bằng tiếng Việt.
                    Chỉ trả JSON hợp lệ theo schema: {"content":"...","hashtags":"#tag #tag","title":"..."}.
                    Mỗi lần tạo phải viết một phiên bản mới, không lặp lại câu mở đầu/cấu trúc nếu cùng brief.
                    Mã biến thể sáng tạo: %s
                    Độ dài mong muốn: %s

                    Tiêu đề nội bộ: %s
                    Mục tiêu: %s
                    Giọng điệu: %s
                    Brief: %s
                    """.formatted(variationSeed, lengthInstruction(request.contentLength()), request.title(), request.goal(), request.tone(), request.brief());
            Map<String, Object> payload = Map.of(
                    "model", model,
                    "messages", List.of(
                            Map.of("role", "system", "content", "You are a creative Vietnamese social media marketing copywriter. Return valid JSON only. Avoid repeating prior wording."),
                            Map.of("role", "user", "content", prompt)
                    ),
                    "temperature", 0.95,
                    "presence_penalty", 0.35,
                    "frequency_penalty", 0.25
            );
            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/chat/completions"))
                    .timeout(timeout)
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                    .build();
            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                return new GenerationResult(false, null, null, "openrouter", model, response.body(), "OPENROUTER_HTTP_" + response.statusCode(), "OpenRouter trả về HTTP " + response.statusCode());
            }
            return toGenerationResult(response.body(), request);
        } catch (IOException exception) {
            return failed("OPENROUTER_IO_ERROR", "Không thể gọi OpenRouter: " + exception.getMessage());
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            return failed("OPENROUTER_INTERRUPTED", "Tác vụ sinh nội dung bị gián đoạn.");
        } catch (RuntimeException exception) {
            return failed("OPENROUTER_CLIENT_ERROR", "Không thể tạo yêu cầu OpenRouter: " + exception.getMessage());
        }
    }

    private GenerationResult toGenerationResult(String responseBody, MarketingPostRequest request) throws JsonProcessingException {
        JsonNode root = objectMapper.readTree(responseBody);
        String text = root.path("choices").path(0).path("message").path("content").asText("");
        JsonNode parsed = parseJsonFromModel(text);
        String content = firstText(parsed, "content", "body");
        String hashtags = firstText(parsed, "hashtags");
        return new GenerationResult(
                hasText(content) || hasText(text),
                hasText(content) ? content : text,
                hasText(hashtags) ? hashtags : "#HomeStays #HomestayVietNam #DuLichNghiDuong",
                "openrouter",
                model,
                responseBody,
                null,
                null
        );
    }

    private JsonNode parseJsonFromModel(String text) {
        String value = String.valueOf(text == null ? "" : text).trim()
                .replaceFirst("^```json\\s*", "")
                .replaceFirst("^```\\s*", "")
                .replaceFirst("```$", "")
                .trim();
        try {
            return objectMapper.readTree(value);
        } catch (Exception ignored) {
            int start = value.indexOf('{');
            int end = value.lastIndexOf('}');
            if (start >= 0 && end > start) {
                try {
                    return objectMapper.readTree(value.substring(start, end + 1));
                } catch (Exception ignoredAgain) {
                    return objectMapper.createObjectNode();
                }
            }
            return objectMapper.createObjectNode();
        }
    }

    private GenerationResult failed(String code, String message) {
        return new GenerationResult(false, null, null, "openrouter", model, null, code, message);
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
        return value == null ? "" : value.replaceAll("/+$", "");
    }

    private String lengthInstruction(String value) {
        if (!hasText(value)) {
            return "STANDARD - khoảng 2-3 đoạn ngắn, đủ CTA và hashtag.";
        }
        return switch (value.trim().toUpperCase()) {
            case "LONGER" -> "LONGER - dài hơn trước, khoảng 4-5 đoạn, giàu hình ảnh, có cảm xúc và CTA rõ.";
            case "SHORTER" -> "SHORTER - ngắn hơn trước, khoảng 1-2 đoạn, vẫn đủ lợi ích chính và CTA.";
            case "CONCISE" -> "CONCISE - cô đọng hơn, đi thẳng vào ý chính, câu ngắn, ít lan man.";
            default -> "STANDARD - khoảng 2-3 đoạn ngắn, đủ CTA và hashtag.";
        };
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
