package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.constraints.NotBlank;
import com.fasterxml.jackson.annotation.JsonProperty;

public record GeminiGenerateRequest(
        @NotBlank(message = "Prompt không được để trống")
        String prompt,

        String systemInstruction,

        @JsonProperty("modelId")
        Integer modelId,

        @JsonProperty("thinkMode")
        Boolean thinkMode,

        Double temperature,

        String cookie,

        String responseFormat,

        String tone,

        String topic,

        String customNote
) {
    public int resolveModelId() {
        return modelId != null ? modelId : 1; // 1 = Gemini 3.7 Flash
    }

    public boolean resolveThinkMode() {
        return thinkMode == null || thinkMode; // default true
    }

    public double resolveTemperature() {
        return temperature != null ? temperature : 0.7;
    }
}
