package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.constraints.NotBlank;

public record PostCommentReplyRequest(
        @NotBlank(message = "Nội dung trả lời không được để trống.")
        String message,
        String responderName
) {
}
