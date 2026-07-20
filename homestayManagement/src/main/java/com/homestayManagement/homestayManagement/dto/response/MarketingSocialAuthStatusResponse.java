package com.homestayManagement.homestayManagement.dto.response;

import java.util.List;

public record MarketingSocialAuthStatusResponse(
        String sessionId,
        String status,
        boolean requiresSelection,
        String expiresAt,
        String accountId,
        List<String> accountIds,
        List<MarketingConnectedAccountResponse> accounts,
        List<MarketingConnectedAccountResponse> selectableAccounts
) {
}
