package com.homestayManagement.homestayManagement.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.homestayManagement.homestayManagement.dto.request.GeminiGenerateRequest;
import com.homestayManagement.homestayManagement.service.impl.GeminiWebServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class GeminiWebServiceTest {

    private GeminiWebServiceImpl geminiWebService;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        geminiWebService = new GeminiWebServiceImpl(objectMapper);
    }

    @Test
    void testGenerateWithNullOrEmptyPrompt_throwsIllegalArgumentException() {
        assertThrows(IllegalArgumentException.class, () -> geminiWebService.generate(null));
        assertThrows(IllegalArgumentException.class, () -> geminiWebService.generate(new GeminiGenerateRequest("", null, 1, true, 0.7, null, "json", null, null, null)));
        assertThrows(IllegalArgumentException.class, () -> geminiWebService.generate(new GeminiGenerateRequest("   ", null, 1, true, 0.7, null, "json", null, null, null)));
    }

    @Test
    void testGenerateRequestModelIdAndThinkModeDefaults() {
        GeminiGenerateRequest request = new GeminiGenerateRequest("Viết bài marketing Sa Pa", null, null, null, null, null, null, null, null, null);
        assertEquals(1, request.resolveModelId());
        assertTrue(request.resolveThinkMode());
        assertEquals(0.7, request.resolveTemperature());
    }

    @Test
    void testNoSilentFallback_throwsExceptionWhenOfflineOrUnauthenticated() {
        GeminiGenerateRequest request = new GeminiGenerateRequest(
                "Viết bài đăng săn mây",
                "Bạn là AI chuyên nghiệp",
                1,
                true,
                0.7,
                "gsk_invalid_mock_key_123",
                "json",
                "WARM",
                "SAN_MAY",
                null
        );

        // MUST throw IllegalStateException instead of returning static canned fallback text
        Exception exception = assertThrows(IllegalStateException.class, () -> geminiWebService.generate(request));
        assertTrue(exception.getMessage().contains("Groq") || exception.getMessage().contains("Không thể"));
    }
}
