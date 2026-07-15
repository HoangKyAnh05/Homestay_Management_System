package com.homestayManagement.homestayManagement.dto.response;

public record MarketingSocialAuthStartResponse(
        String platform,
        String sessionId,
        String url,
        String expiresAt
) {
}
