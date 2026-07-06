package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CustomerAiHistoryMessageRequest(
        @NotBlank(message = "Vai trò tin nhắn không được để trống")
        @Pattern(regexp = "user|assistant", message = "Vai trò tin nhắn không hợp lệ")
        String role,

        @NotBlank(message = "Nội dung lịch sử không được để trống")
        @Size(max = 4000, message = "Nội dung lịch sử quá dài")
        String content
) {
}
