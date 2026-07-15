package com.homestayManagement.homestayManagement.dto.response;

public record MarketingConnectedAccountResponse(
        Long localSocialAccountId,
        String accountId,
        String platform,
        String platformUid,
        String displayName,
        String avatarUrl,
        String pageUrl
) {
}
