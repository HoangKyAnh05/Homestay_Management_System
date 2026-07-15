package com.homestayManagement.homestayManagement.dto.response;

import java.time.LocalDateTime;

public record SocialAccountResponse(
        Long id,
        String platform,
        String accountName,
        String pageUrl,
        String externalAccountId,
        boolean active,
        LocalDateTime tokenExpiresAt
) {
}
