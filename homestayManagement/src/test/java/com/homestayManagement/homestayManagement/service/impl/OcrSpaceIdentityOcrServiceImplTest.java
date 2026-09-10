package com.homestayManagement.homestayManagement.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class OcrSpaceIdentityOcrServiceImplTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void extractIdentity_shouldThrowWhenOcrNotEnabled() {
        OcrSpaceIdentityOcrServiceImpl service = new OcrSpaceIdentityOcrServiceImpl(
                objectMapper,
                false,
                "https://api.ocr.space/parse/image",
                "K84216463288957",
                "",
                "https://api.openai.com/v1",
                25,
                10
        );

        MockMultipartFile front = new MockMultipartFile("front", "front.jpg", "image/jpeg", new byte[]{1, 2, 3});
        MockMultipartFile back = new MockMultipartFile("back", "back.jpg", "image/jpeg", new byte[]{4, 5, 6});

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                service.extractIdentity(front, back)
        );

        assertTrue(ex.getMessage().contains("Chưa bật cấu hình OCR căn cước"));
    }

    @Test
    void extractIdentity_shouldThrowWhenApiKeyIsBlank() {
        OcrSpaceIdentityOcrServiceImpl service = new OcrSpaceIdentityOcrServiceImpl(
                objectMapper,
                true,
                "https://api.ocr.space/parse/image",
                "",
                "",
                "https://api.openai.com/v1",
                25,
                10
        );

        MockMultipartFile front = new MockMultipartFile("front", "front.jpg", "image/jpeg", new byte[]{1, 2, 3});
        MockMultipartFile back = new MockMultipartFile("back", "back.jpg", "image/jpeg", new byte[]{4, 5, 6});

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                service.extractIdentity(front, back)
        );

        assertTrue(ex.getMessage().contains("Chưa cấu hình API Key OCR.Space hoặc Vision AI"));
    }

    @Test
    void extractIdentity_shouldThrowWhenFrontImageIsNull() {
        OcrSpaceIdentityOcrServiceImpl service = new OcrSpaceIdentityOcrServiceImpl(
                objectMapper,
                true,
                "https://api.ocr.space/parse/image",
                "K84216463288957",
                "",
                "https://api.openai.com/v1",
                25,
                10
        );

        MockMultipartFile back = new MockMultipartFile("back", "back.jpg", "image/jpeg", new byte[]{4, 5, 6});

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                service.extractIdentity(null, back)
        );

        assertTrue(ex.getMessage().contains("Vui lòng chọn ảnh mặt trước căn cước"));
    }
}
