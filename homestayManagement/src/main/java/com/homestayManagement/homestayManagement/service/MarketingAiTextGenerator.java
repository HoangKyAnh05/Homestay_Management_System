package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.request.MarketingPostRequest;

public interface MarketingAiTextGenerator {
    GenerationResult generate(MarketingPostRequest request);

    record GenerationResult(
            boolean success,
            String content,
            String hashtags,
            String provider,
            String modelName,
            String responsePayload,
            String errorCode,
            String errorMessage
    ) {
    }
}
