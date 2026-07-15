package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record SocialAccountRequest(
        @NotBlank @Size(max = 30) String platform,
        @NotBlank @Size(max = 120) String accountName,
        @Size(max = 500) String pageUrl,
        @Size(max = 160) String externalAccountId,
        String accessToken,
        String refreshToken,
        LocalDateTime tokenExpiresAt
) {
}
