package com.homestayManagement.homestayManagement.dto.response;

import java.time.LocalDateTime;

public record CustomerAiChatResponse(
        String answer,
        String sessionId,
        boolean authenticated,
        LocalDateTime respondedAt
) {
}
