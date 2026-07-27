package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.request.CustomerAiHistoryMessageRequest;

import java.util.List;
import java.util.Map;
import java.util.function.Consumer;

public interface CustomerAiClient {
    CustomerAiClientResponse chat(CustomerAiClientRequest request);
    CustomerAiClientResponse chatStream(CustomerAiClientRequest request, Consumer<String> deltaConsumer);

    record CustomerAiClientRequest(
            String message,
            String sessionId,
            String pagePath,
            String audience,
            boolean authenticated,
            Map<String, Object> publicContext,
            Map<String, Object> customerContext,
            List<CustomerAiHistoryMessageRequest> history
    ) {
    }

    record CustomerAiClientResponse(String answer, String model) {
    }
}
