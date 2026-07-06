package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CustomerAiChatRequest(
        @NotBlank(message = "Vui lòng nhập câu hỏi")
        @Size(max = 1000, message = "Câu hỏi không được vượt quá 1000 ký tự")
        String message,

        @NotBlank(message = "Phiên trò chuyện không hợp lệ")
        @Pattern(
                regexp = "[A-Za-z0-9_-]{8,64}",
                message = "Phiên trò chuyện không hợp lệ"
        )
        String sessionId,

        @Size(max = 200, message = "Đường dẫn trang quá dài")
        String pagePath,

        @Size(max = 10, message = "Chỉ gửi tối đa 10 tin nhắn lịch sử")
        List<@Valid CustomerAiHistoryMessageRequest> history
) {
}
