package com.homestayManagement.homestayManagement.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.homestayManagement.homestayManagement.service.CustomerAiClient;
import com.homestayManagement.homestayManagement.service.CustomerAiUnavailableException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.function.Consumer;
import java.util.stream.Stream;

@Component
public class OpenChatBiCustomerClient implements CustomerAiClient {

    private static final Logger log = LoggerFactory.getLogger(OpenChatBiCustomerClient.class);

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final URI chatUri;
    private final URI chatStreamUri;
    private final String internalToken;
    private final Duration requestTimeout;

    public OpenChatBiCustomerClient(
            ObjectMapper objectMapper,
            @Value("${ai.customer.service-url:http://127.0.0.1:8001}") String serviceUrl,
            @Value("${ai.customer.internal-token:}") String internalToken,
            @Value("${ai.customer.timeout-seconds:60}") long timeoutSeconds
    ) {
        this.objectMapper = objectMapper;
        this.internalToken = internalToken == null ? "" : internalToken.trim();
        this.requestTimeout = Duration.ofSeconds(Math.max(5, timeoutSeconds));
        String normalizedServiceUrl = serviceUrl.replaceAll("/+$", "");
        this.chatUri = URI.create(normalizedServiceUrl + "/customer/chat");
        this.chatStreamUri = URI.create(normalizedServiceUrl + "/customer/chat/stream");
        this.httpClient = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .connectTimeout(Duration.ofSeconds(5))
                .build();
    }

    @Override
    public CustomerAiClientResponse chat(CustomerAiClientRequest request) {
        if (internalToken.isBlank()) {
            throw new CustomerAiUnavailableException(
                    "AI chat chưa được cấu hình. Vui lòng cấu hình AI_INTERNAL_TOKEN."
            );
        }

        try {
            HttpRequest httpRequest = HttpRequest.newBuilder(chatUri)
                    .version(HttpClient.Version.HTTP_1_1)
                    .timeout(requestTimeout)
                    .header("Content-Type", "application/json")
                    .header("X-Internal-Token", internalToken)
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(toSidecarBody(request))))
                    .build();
            HttpResponse<String> response = httpClient.send(
                    httpRequest,
                    HttpResponse.BodyHandlers.ofString()
            );

            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.error(
                        "Customer AI sidecar returned HTTP {} from {}. Body: {}",
                        response.statusCode(),
                        chatUri,
                        response.body()
                );
                throw new CustomerAiUnavailableException(resolveErrorMessage(response.body()));
            }
            JsonNode responseBody = objectMapper.readTree(response.body());
            String answer = responseBody.path("answer").asText("").trim();
            if (answer.isBlank()) {
                throw new CustomerAiUnavailableException("AI không trả về nội dung.");
            }
            return new CustomerAiClientResponse(
                    answer,
                    responseBody.path("model").asText("")
            );
        } catch (CustomerAiUnavailableException exception) {
            log.error("Customer AI unavailable: {}", exception.getMessage(), exception);
            throw exception;
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            log.error(
                    "Customer AI request was interrupted while calling {}. ErrorType={} ErrorMessage={}",
                    chatUri,
                    exception.getClass().getName(),
                    exception.getMessage(),
                    exception
            );
            throw new CustomerAiUnavailableException("Yêu cầu AI đã bị gián đoạn.", exception);
        } catch (Exception exception) {
            log.error(
                    "Customer AI request failed while calling {}. ErrorType={} ErrorMessage={}",
                    chatUri,
                    exception.getClass().getName(),
                    exception.getMessage(),
                    exception
            );
            throw new CustomerAiUnavailableException(
                    "AI chat đang tạm thời không khả dụng. Vui lòng thử lại sau.",
                    exception
            );
        }
    }

    @Override
    public CustomerAiClientResponse chatStream(CustomerAiClientRequest request, Consumer<String> deltaConsumer) {
        if (internalToken.isBlank()) {
            throw new CustomerAiUnavailableException(
                    "AI chat chÆ°a Ä‘Æ°á»£c cáº¥u hÃ¬nh. Vui lÃ²ng cáº¥u hÃ¬nh AI_INTERNAL_TOKEN."
            );
        }

        try {
            HttpRequest httpRequest = HttpRequest.newBuilder(chatStreamUri)
                    .version(HttpClient.Version.HTTP_1_1)
                    .timeout(requestTimeout)
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/x-ndjson")
                    .header("X-Internal-Token", internalToken)
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(toSidecarBody(request))))
                    .build();
            HttpResponse<Stream<String>> response = httpClient.send(
                    httpRequest,
                    HttpResponse.BodyHandlers.ofLines()
            );

            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                String responseBody;
                try (Stream<String> lines = response.body()) {
                    responseBody = String.join("\n", lines.toList());
                }
                log.error(
                        "Customer AI stream sidecar returned HTTP {} from {}. Body: {}",
                        response.statusCode(),
                        chatStreamUri,
                        responseBody
                );
                throw new CustomerAiUnavailableException(resolveErrorMessage(responseBody));
            }

            StringBuilder streamedAnswer = new StringBuilder();
            String[] doneAnswer = {null};
            String[] model = {""};
            try (Stream<String> lines = response.body()) {
                lines.filter(line -> line != null && !line.isBlank()).forEach(line -> {
                    try {
                        JsonNode event = objectMapper.readTree(line);
                        String type = event.path("type").asText("");
                        if ("meta".equals(type)) {
                            model[0] = event.path("model").asText(model[0]);
                        } else if ("delta".equals(type)) {
                            String text = event.path("text").asText("");
                            if (!text.isBlank()) {
                                streamedAnswer.append(text);
                                deltaConsumer.accept(text);
                            }
                        } else if ("done".equals(type)) {
                            doneAnswer[0] = event.path("answer").asText(streamedAnswer.toString()).trim();
                            model[0] = event.path("model").asText(model[0]);
                        } else if ("error".equals(type)) {
                            throw new CustomerAiUnavailableException(event.path("message").asText("AI chat Ä‘ang táº¡m thá»i khÃ´ng kháº£ dá»¥ng."));
                        }
                    } catch (CustomerAiUnavailableException exception) {
                        throw exception;
                    } catch (Exception exception) {
                        throw new CustomerAiUnavailableException("KhÃ´ng thá»ƒ Ä‘á»c dá»¯ liá»‡u stream tá»« AI.", exception);
                    }
                });
            }
            String answer = doneAnswer[0] == null ? streamedAnswer.toString().trim() : doneAnswer[0];
            if (answer.isBlank()) {
                throw new CustomerAiUnavailableException("AI khÃ´ng tráº£ vá» ná»™i dung.");
            }
            return new CustomerAiClientResponse(answer, model[0]);
        } catch (CustomerAiUnavailableException exception) {
            log.error("Customer AI stream unavailable: {}", exception.getMessage(), exception);
            throw exception;
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            log.error(
                    "Customer AI stream request was interrupted while calling {}. ErrorType={} ErrorMessage={}",
                    chatStreamUri,
                    exception.getClass().getName(),
                    exception.getMessage(),
                    exception
            );
            throw new CustomerAiUnavailableException("YÃªu cáº§u AI Ä‘Ã£ bá»‹ giÃ¡n Ä‘oáº¡n.", exception);
        } catch (Exception exception) {
            log.error(
                    "Customer AI stream request failed while calling {}. ErrorType={} ErrorMessage={}",
                    chatStreamUri,
                    exception.getClass().getName(),
                    exception.getMessage(),
                    exception
            );
            throw new CustomerAiUnavailableException(
                    "AI chat Ä‘ang táº¡m thá»i khÃ´ng kháº£ dá»¥ng. Vui lÃ²ng thá»­ láº¡i sau.",
                    exception
            );
        }
    }

    private Map<String, Object> toSidecarBody(CustomerAiClientRequest request) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("message", request.message());
        body.put("session_id", request.sessionId());
        body.put("page_path", request.pagePath());
        body.put("audience", request.audience());
        body.put("authenticated", request.authenticated());
        body.put("public_context", request.publicContext());
        body.put("customer_context", request.customerContext());
        body.put("history", request.history());
        return body;
    }

    private String resolveErrorMessage(String responseBody) {
        try {
            String detail = objectMapper.readTree(responseBody).path("detail").asText("").trim();
            if (detail.contains("OPENAI_API_KEY")) {
                return "AI chat chưa được cấu hình API key.";
            }
            if (!detail.isBlank()) {
                return detail;
            }
        } catch (Exception ignored) {
            // Fall through to the safe generic message.
        }
        return "AI chat đang tạm thời không khả dụng. Vui lòng thử lại sau.";
    }
}
