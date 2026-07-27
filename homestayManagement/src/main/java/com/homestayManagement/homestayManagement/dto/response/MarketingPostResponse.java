package com.homestayManagement.homestayManagement.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public record MarketingPostResponse(
        Long id,
        String title,
        String brief,
        String targetAudience,
        String goal,
        String tone,
        String contentLength,
        String status,
        String approvalStatus,
        String sourceType,
        LocalDateTime createdAt,
        List<MarketingChannelResponse> channels,
        List<MarketingMediaResponse> media
) {
}
