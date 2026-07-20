package com.homestayManagement.homestayManagement.dto.response;

import java.time.LocalDateTime;

public record MarketingChannelResponse(
        Long id,
        Long socialAccountId,
        String platform,
        String pageName,
        String pageUrl,
        String content,
        String hashtags,
        String platformOptionJson,
        String relayFlowId,
        String relayTaskId,
        LocalDateTime scheduledAt,
        LocalDateTime postedAt,
        String status,
        String externalPostId,
        String externalUrl,
        String errorMessage
) {
}
