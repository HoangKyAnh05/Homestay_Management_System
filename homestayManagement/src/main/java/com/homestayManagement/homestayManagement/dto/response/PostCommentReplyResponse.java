package com.homestayManagement.homestayManagement.dto.response;

public record PostCommentReplyResponse(
        String replyId,
        String parentCommentId,
        String responderName,
        String responderAvatarUrl,
        String message,
        String createdTime,
        String platform,
        boolean success,
        String note
) {
}
