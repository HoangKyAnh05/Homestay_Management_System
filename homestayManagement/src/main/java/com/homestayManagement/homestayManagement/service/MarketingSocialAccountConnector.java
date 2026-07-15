package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.request.MarketingSocialAuthStartRequest;
import com.homestayManagement.homestayManagement.dto.response.MarketingConnectedAccountResponse;
import com.homestayManagement.homestayManagement.dto.response.MarketingSocialAuthStartResponse;
import com.homestayManagement.homestayManagement.dto.response.MarketingSocialAuthStatusResponse;

import java.util.List;

public interface MarketingSocialAccountConnector {
    MarketingSocialAuthStartResponse startAuth(MarketingSocialAuthStartRequest request);

    MarketingSocialAuthStatusResponse getAuthStatus(String platform, String sessionId);

    List<MarketingConnectedAccountResponse> listAccounts(String platform);
}
