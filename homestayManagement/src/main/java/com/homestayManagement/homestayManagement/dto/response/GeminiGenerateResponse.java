package com.homestayManagement.homestayManagement.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record GeminiGenerateResponse(
        boolean success,
        String content,
        String model,
        String thinking,
        String finishReason,
        String title,
        String caption,
        String hashtags,
        String error
) {
    public static GeminiGenerateResponse ok(String content, String model, String thinking, String title, String caption, String hashtags) {
        return new GeminiGenerateResponse(true, content, model, thinking, "STOP", title, caption, hashtags, null);
    }

    public static GeminiGenerateResponse fail(String errorMessage) {
        return new GeminiGenerateResponse(false, null, "Gemini 3.7 Flash", null, "ERROR", null, null, null, errorMessage);
    }
}
