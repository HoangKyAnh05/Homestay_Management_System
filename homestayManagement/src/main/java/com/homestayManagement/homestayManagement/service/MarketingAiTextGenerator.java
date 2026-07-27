package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.request.MarketingPostRequest;

import java.util.function.Consumer;

public interface MarketingAiTextGenerator {
    GenerationResult generate(MarketingPostRequest request);
    GenerationResult generateStream(MarketingPostRequest request, Consumer<String> deltaConsumer);

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
