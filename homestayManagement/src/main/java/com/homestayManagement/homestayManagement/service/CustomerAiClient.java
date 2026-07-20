package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.request.CustomerAiHistoryMessageRequest;

import java.util.List;
import java.util.Map;

public interface CustomerAiClient {
    CustomerAiClientResponse chat(CustomerAiClientRequest request);

    record CustomerAiClientRequest(
            String message,
            String sessionId,
            String pagePath,
            boolean authenticated,
            Map<String, Object> publicContext,
            Map<String, Object> customerContext,
            List<CustomerAiHistoryMessageRequest> history
    ) {
    }

    record CustomerAiClientResponse(String answer, String model) {
    }
}
