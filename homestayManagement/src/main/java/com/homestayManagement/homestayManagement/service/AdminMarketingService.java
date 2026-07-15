package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.request.MarketingOptionRequest;
import com.homestayManagement.homestayManagement.dto.request.MarketingChannelContentRequest;
import com.homestayManagement.homestayManagement.dto.request.MarketingPostRequest;
import com.homestayManagement.homestayManagement.dto.request.MarketingSocialAuthStartRequest;
import com.homestayManagement.homestayManagement.dto.request.ScheduleMarketingChannelRequest;
import com.homestayManagement.homestayManagement.dto.request.SocialAccountRequest;
import com.homestayManagement.homestayManagement.dto.response.MarketingConnectedAccountResponse;
import com.homestayManagement.homestayManagement.dto.response.MarketingDashboardResponse;
import com.homestayManagement.homestayManagement.dto.response.MarketingMediaUploadResponse;
import com.homestayManagement.homestayManagement.dto.response.MarketingOptionResponse;
import com.homestayManagement.homestayManagement.dto.response.MarketingPostResponse;
import com.homestayManagement.homestayManagement.dto.response.MarketingSocialAuthStartResponse;
import com.homestayManagement.homestayManagement.dto.response.MarketingSocialAuthStatusResponse;
import com.homestayManagement.homestayManagement.dto.response.SocialAccountResponse;
import org.springframework.security.core.Authentication;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

import java.util.List;

public interface AdminMarketingService {
    MarketingDashboardResponse dashboard();
    SocialAccountResponse createSocialAccount(SocialAccountRequest request, Authentication authentication);
    void deleteSocialAccount(Long id);
    MarketingOptionResponse createOption(MarketingOptionRequest request);
    void deleteOption(Long id);
    MarketingPostResponse generatePost(MarketingPostRequest request, Authentication authentication);
    MarketingPostResponse updateChannelContent(Long channelId, MarketingChannelContentRequest request);
    MarketingPostResponse scheduleChannel(Long channelId, ScheduleMarketingChannelRequest request);
    MarketingPostResponse publishChannel(Long channelId);
    MarketingPostResponse getPost(Long postId);
    MarketingSocialAuthStartResponse startSocialAuth(MarketingSocialAuthStartRequest request);
    MarketingSocialAuthStatusResponse getSocialAuthStatus(String platform, String sessionId);
    List<MarketingConnectedAccountResponse> listConnectedSocialAccounts(String platform);
    MarketingMediaUploadResponse uploadMedia(MultipartFile file) throws IOException;
}
