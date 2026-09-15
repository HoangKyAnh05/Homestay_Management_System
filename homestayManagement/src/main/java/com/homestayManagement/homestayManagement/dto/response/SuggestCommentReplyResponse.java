package com.homestayManagement.homestayManagement.dto.response;

public record SuggestCommentReplyResponse(
        String suggestedReply,
        String tone,
        boolean success
) {
}
