package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record MarketingChannelRequest(
        Long socialAccountId,
        @NotBlank @Size(max = 30) String platform,
        @Size(max = 120) String pageName,
        @Size(max = 500) String pageUrl,
        String content,
        String hashtags,
        String platformOptionJson,
        LocalDateTime scheduledAt
) {
}
