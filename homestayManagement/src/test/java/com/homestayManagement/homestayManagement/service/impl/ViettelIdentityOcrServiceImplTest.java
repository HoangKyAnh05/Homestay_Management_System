package com.homestayManagement.homestayManagement.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import static org.junit.jupiter.api.Assertions.*;

class ViettelIdentityOcrServiceImplTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void extractIdentity_shouldThrowWhenOcrNotEnabled() {
        ViettelIdentityOcrServiceImpl service = new ViettelIdentityOcrServiceImpl(
                objectMapper,
                false,
                "https://viettelai.vn/ocr/id_card",
                "5024c3cba24cfa38d315d76fef056dcc",
                20,
                8
        );

        MockMultipartFile front = new MockMultipartFile("front", "front.jpg", "image/jpeg", new byte[]{1, 2, 3});
        MockMultipartFile back = new MockMultipartFile("back", "back.jpg", "image/jpeg", new byte[]{4, 5, 6});

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                service.extractIdentity(front, back)
        );

        assertTrue(ex.getMessage().contains("Chưa bật cấu hình OCR căn cước"));
    }

    @Test
    void extractIdentity_shouldThrowWhenTokenIsBlank() {
        ViettelIdentityOcrServiceImpl service = new ViettelIdentityOcrServiceImpl(
                objectMapper,
                true,
                "https://viettelai.vn/ocr/id_card",
                "",
                20,
                8
        );

        MockMultipartFile front = new MockMultipartFile("front", "front.jpg", "image/jpeg", new byte[]{1, 2, 3});
        MockMultipartFile back = new MockMultipartFile("back", "back.jpg", "image/jpeg", new byte[]{4, 5, 6});

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                service.extractIdentity(front, back)
        );

        assertTrue(ex.getMessage().contains("Chưa cấu hình token Viettel AI OCR"));
    }

    @Test
    void extractIdentity_shouldThrowWhenFrontImageIsNull() {
        ViettelIdentityOcrServiceImpl service = new ViettelIdentityOcrServiceImpl(
                objectMapper,
                true,
                "https://viettelai.vn/ocr/id_card",
                "5024c3cba24cfa38d315d76fef056dcc",
                20,
                8
        );

        MockMultipartFile back = new MockMultipartFile("back", "back.jpg", "image/jpeg", new byte[]{4, 5, 6});

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                service.extractIdentity(null, back)
        );

        assertTrue(ex.getMessage().contains("Vui lòng chọn ảnh mặt trước căn cước"));
    }

    @Test
    void extractIdentity_shouldThrowWhenBackImageIsNotAnImage() {
        ViettelIdentityOcrServiceImpl service = new ViettelIdentityOcrServiceImpl(
                objectMapper,
                true,
                "https://viettelai.vn/ocr/id_card",
                "5024c3cba24cfa38d315d76fef056dcc",
                20,
                8
        );

        MockMultipartFile front = new MockMultipartFile("front", "front.jpg", "image/jpeg", new byte[]{1, 2, 3});
        MockMultipartFile back = new MockMultipartFile("back", "back.pdf", "application/pdf", new byte[]{4, 5, 6});

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                service.extractIdentity(front, back)
        );

        assertTrue(ex.getMessage().contains("Tệp tải lên phải là ảnh mặt sau căn cước"));
    }
}
