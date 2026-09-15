package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.constraints.NotBlank;

public record SuggestCommentReplyRequest(
        String postTitle,
        String postContent,
        @NotBlank(message = "Bình luận của khách không được để trống")
        String commentText,
        String tone
) {
}
