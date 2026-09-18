package com.homestayManagement.homestayManagement.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.homestayManagement.homestayManagement.dto.request.GeminiGenerateRequest;
import com.homestayManagement.homestayManagement.dto.response.GeminiGenerateResponse;
import com.homestayManagement.homestayManagement.service.GeminiWebService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;

@Service
public class GeminiWebServiceImpl implements GeminiWebService {

    private static final Logger log = LoggerFactory.getLogger(GeminiWebServiceImpl.class);

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    @Value("${marketing.ai.groq-api-key:}")
    private String defaultGroqApiKey;

    @Value("${marketing.ai.groq-base-url:https://api.groq.com/openai/v1}")
    private String defaultGroqBaseUrl;

    @Value("${marketing.ai.groq-model:llama-3.3-70b-versatile}")
    private String defaultGroqModel;

    @Value("${marketing.ai.gemini-api-key:}")
    private String defaultGeminiApiKey;

    @Value("${marketing.ai.gemini-model:gemini-3.7-flash}")
    private String defaultGeminiModel;

    public GeminiWebServiceImpl(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_2)
                .connectTimeout(Duration.ofSeconds(25))
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();
    }

    public void setDefaultGroqApiKey(String defaultGroqApiKey) {
        this.defaultGroqApiKey = defaultGroqApiKey;
    }

    public void setDefaultGroqBaseUrl(String defaultGroqBaseUrl) {
        this.defaultGroqBaseUrl = defaultGroqBaseUrl;
    }

    public void setDefaultGroqModel(String defaultGroqModel) {
        this.defaultGroqModel = defaultGroqModel;
    }

    @Override
    public GeminiGenerateResponse generate(GeminiGenerateRequest request) {
        if (request == null || !hasText(request.prompt())) {
            throw new IllegalArgumentException("Prompt không được để trống.");
        }

        String prompt = request.prompt().trim();
        String systemInstruction = hasText(request.systemInstruction()) ? request.systemInstruction().trim() : null;
        String userPassedKey = hasText(request.cookie()) ? request.cookie().trim() : null;

        // 1. Try Groq AI (Llama 3.3 70B / Llama 3.1 8B)
        String groqKey = defaultGroqApiKey;
        if (hasText(userPassedKey) && userPassedKey.startsWith("gsk_")) {
            groqKey = userPassedKey;
        }

        Exception groqException = null;
        if (hasText(groqKey)) {
            try {
                GeminiGenerateResponse groqRes = executeGroqChat(prompt, systemInstruction, groqKey, request.resolveTemperature());
                if (groqRes != null && groqRes.success() && hasText(groqRes.content())) {
                    return groqRes;
                }
            } catch (Exception e) {
                log.warn("Groq AI API error: {}", e.getMessage());
                groqException = e;
            }
        }

        // 2. Try Google Gemini API Key if user passed Google key (starts with AIza) or configured
        String geminiKey = defaultGeminiApiKey;
        if (hasText(userPassedKey) && (userPassedKey.startsWith("AIza") || userPassedKey.startsWith("AQ."))) {
            geminiKey = userPassedKey;
        }

        Exception geminiException = null;
        if (hasText(geminiKey)) {
            try {
                String combinedPrompt = (systemInstruction != null ? systemInstruction + "\n\n" : "") + prompt;
                GeminiGenerateResponse geminiRes = executeGeminiApiKey(combinedPrompt, geminiKey);
                if (geminiRes != null && geminiRes.success() && hasText(geminiRes.content())) {
                    return geminiRes;
                }
            } catch (Exception e) {
                log.warn("Gemini API Key error: {}", e.getMessage());
                geminiException = e;
            }
        }

        // 3. No silent fallback - report error clearly
        StringBuilder errorMsg = new StringBuilder("Không thể tạo nội dung từ AI Engine.");
        if (groqException != null) {
            errorMsg.append(" Groq Error: ").append(groqException.getMessage()).append(".");
        }
        if (geminiException != null) {
            errorMsg.append(" Gemini Error: ").append(geminiException.getMessage()).append(".");
        }
        if (groqException == null && geminiException == null) {
            errorMsg.append(" Chưa cấu hình API Key (GROQ_API_KEY hoặc GEMINI_API_KEY). Vui lòng cấu hình API Key trong hệ thống.");
        }

        throw new IllegalStateException(errorMsg.toString());
    }

    private GeminiGenerateResponse executeGroqChat(String prompt, String systemInstruction, String apiKey, double temperature) throws Exception {
        String baseUrl = hasText(defaultGroqBaseUrl) ? defaultGroqBaseUrl.trim() : "https://api.groq.com/openai/v1";
        if (baseUrl.endsWith("/")) {
            baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        }
        String endpoint = baseUrl + "/chat/completions";

        List<String> models = new ArrayList<>();
        if (hasText(defaultGroqModel)) {
            models.add(defaultGroqModel.trim());
        }
        for (String m : List.of("openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b", "groq/compound", "groq/compound-mini", "deepseek-r1-distill-llama-70b", "llama-3.3-70b-versatile", "llama-3.1-8b-instant")) {
            if (!models.contains(m)) {
                models.add(m);
            }
        }

        List<Map<String, String>> messages = new ArrayList<>();
        if (hasText(systemInstruction)) {
            messages.add(Map.of("role", "system", "content", systemInstruction));
        }
        messages.add(Map.of("role", "user", "content", prompt));

        Exception lastEx = null;
        for (String model : models) {
            try {
                Map<String, Object> reqBody = new HashMap<>();
                reqBody.put("model", model);
                reqBody.put("messages", messages);
                reqBody.put("temperature", temperature);
                reqBody.put("max_tokens", 2048);

                HttpRequest req = HttpRequest.newBuilder()
                        .uri(URI.create(endpoint))
                        .header("Content-Type", "application/json")
                        .header("Authorization", "Bearer " + apiKey)
                        .header("User-Agent", "Mozilla/5.0")
                        .timeout(Duration.ofSeconds(30))
                        .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(reqBody), StandardCharsets.UTF_8))
                        .build();

                HttpResponse<String> res = httpClient.send(req, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
                if (res.statusCode() == 200) {
                    JsonNode root = objectMapper.readTree(res.body());
                    JsonNode choices = root.path("choices");
                    if (choices.isArray() && choices.size() > 0) {
                        JsonNode msgNode = choices.get(0).path("message");
                        String content = msgNode.path("content").asText();
                        if (hasText(content)) {
                            return parseStructuredContent(content, "Groq AI (" + model + ")");
                        }
                    }
                } else {
                    log.warn("Groq model {} failed with HTTP {}: {}", model, res.statusCode(), res.body());
                    lastEx = new IllegalStateException("Groq API error HTTP " + res.statusCode() + ": " + res.body());
                }
            } catch (Exception ex) {
                log.warn("Groq model {} request exception: {}", model, ex.getMessage());
                lastEx = ex;
            }
        }

        if (lastEx != null) {
            throw lastEx;
        }
        throw new IllegalStateException("Không nhận được nội dung phản hồi từ Groq AI.");
    }

    private GeminiGenerateResponse executeGeminiApiKey(String prompt, String apiKey) throws Exception {
        List<String> models = List.of(
                hasText(defaultGeminiModel) ? defaultGeminiModel : "gemini-2.0-flash",
                "gemini-1.5-flash",
                "gemini-2.5-flash",
                "gemini-flash-latest"
        );
        Exception lastEx = null;

        for (String model : models) {
            try {
                String apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey;
                Map<String, Object> bodyObj = Map.of(
                        "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                        "generationConfig", Map.of("temperature", 0.7)
                );

                HttpRequest req = HttpRequest.newBuilder()
                        .uri(URI.create(apiUrl))
                        .header("Content-Type", "application/json")
                        .timeout(Duration.ofSeconds(20))
                        .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(bodyObj), StandardCharsets.UTF_8))
                        .build();

                HttpResponse<String> res = httpClient.send(req, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
                if (res.statusCode() == 200) {
                    JsonNode root = objectMapper.readTree(res.body());
                    JsonNode candidates = root.path("candidates");
                    if (candidates.isArray() && candidates.size() > 0) {
                        JsonNode parts = candidates.get(0).path("content").path("parts");
                        if (parts.isArray() && parts.size() > 0) {
                            String text = parts.get(0).path("text").asText();
                            if (hasText(text)) {
                                return parseStructuredContent(text, "Gemini AI (" + model + ")");
                            }
                        }
                    }
                } else {
                    lastEx = new IllegalStateException("Google API error HTTP " + res.statusCode() + " - " + res.body());
                }
            } catch (Exception ex) {
                lastEx = ex;
            }
        }

        if (lastEx != null) {
            throw lastEx;
        }
        throw new IllegalStateException("Không nhận được nội dung từ Gemini API.");
    }

    private GeminiGenerateResponse parseStructuredContent(String rawText, String modelName) {
        String title = null;
        String caption = rawText;
        String hashtags = "#LaDoHomestay #SaPa #SanMaySaPa #ReviewSaPa #DuLichSaPa #VoucherHomestay #shorts #reels #fyp";

        // Try extracting JSON if model returned JSON block
        try {
            String jsonClean = rawText.trim();
            if (jsonClean.contains("```json")) {
                jsonClean = jsonClean.substring(jsonClean.indexOf("```json") + 7);
                if (jsonClean.contains("```")) {
                    jsonClean = jsonClean.substring(0, jsonClean.indexOf("```"));
                }
            } else if (jsonClean.contains("```")) {
                jsonClean = jsonClean.substring(jsonClean.indexOf("```") + 3);
                if (jsonClean.contains("```")) {
                    jsonClean = jsonClean.substring(0, jsonClean.indexOf("```"));
                }
            }
            jsonClean = jsonClean.trim();

            if (jsonClean.startsWith("{") && jsonClean.endsWith("}")) {
                JsonNode node = objectMapper.readTree(jsonClean);
                if (node.has("title")) title = node.get("title").asText();
                if (node.has("caption")) caption = node.get("caption").asText();
                if (node.has("content") && !hasText(caption)) caption = node.get("content").asText();
                if (node.has("hashtags")) hashtags = node.get("hashtags").asText();
            }
        } catch (Exception ignored) {}

        return GeminiGenerateResponse.ok(rawText, modelName, "Processed via " + modelName, title, caption, hashtags);
    }

    private boolean hasText(String str) {
        return str != null && !str.trim().isEmpty();
    }
}
