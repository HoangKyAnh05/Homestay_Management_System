package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record MarketingDashboardResponse(
        long draftPosts,
        long scheduledChannels,
        long publishedChannels,
        long failedChannels,
        long totalReach,
        BigDecimal averageEngagementRate,
        List<SocialAccountResponse> socialAccounts,
        List<MarketingOptionResponse> goals,
        List<MarketingOptionResponse> tones,
        List<MarketingSuggestionResponse> suggestions,
        List<MarketingPostResponse> recentPosts
) {
}
