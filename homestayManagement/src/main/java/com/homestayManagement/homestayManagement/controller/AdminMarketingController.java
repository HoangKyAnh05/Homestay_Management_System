package com.homestayManagement.homestayManagement.controller;

import com.homestayManagement.homestayManagement.dto.request.MarketingOptionRequest;
import com.homestayManagement.homestayManagement.dto.request.MarketingChannelContentRequest;
import com.homestayManagement.homestayManagement.dto.request.MarketingPostRequest;
import com.homestayManagement.homestayManagement.dto.request.MarketingRegenerateContentRequest;
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
import com.homestayManagement.homestayManagement.service.AdminMarketingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/marketing")
public class AdminMarketingController {

    private final AdminMarketingService adminMarketingService;

    public AdminMarketingController(AdminMarketingService adminMarketingService) {
        this.adminMarketingService = adminMarketingService;
    }

    @GetMapping("/dashboard")
    public MarketingDashboardResponse dashboard() {
        return adminMarketingService.dashboard();
    }

    @PostMapping("/social-accounts")
    @ResponseStatus(HttpStatus.CREATED)
    public SocialAccountResponse createSocialAccount(
            @Valid @RequestBody SocialAccountRequest request,
            Authentication authentication
    ) {
        return adminMarketingService.createSocialAccount(request, authentication);
    }

    @DeleteMapping("/social-accounts/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteSocialAccount(@PathVariable Long id) {
        adminMarketingService.deleteSocialAccount(id);
    }

    @PostMapping("/social-auth/start")
    public MarketingSocialAuthStartResponse startSocialAuth(@Valid @RequestBody MarketingSocialAuthStartRequest request) {
        return adminMarketingService.startSocialAuth(request);
    }

    @GetMapping("/social-auth/status")
    public MarketingSocialAuthStatusResponse getSocialAuthStatus(
            @RequestParam String platform,
            @RequestParam String sessionId
    ) {
        return adminMarketingService.getSocialAuthStatus(platform, sessionId);
    }

    @GetMapping("/social-auth/accounts")
    public List<MarketingConnectedAccountResponse> listConnectedSocialAccounts(
            @RequestParam(required = false) String platform
    ) {
        return adminMarketingService.listConnectedSocialAccounts(platform);
    }

    @PostMapping("/media/upload")
    public MarketingMediaUploadResponse uploadMedia(@RequestParam("file") MultipartFile file) throws IOException {
        return adminMarketingService.uploadMedia(file);
    }

    @PostMapping("/options")
    @ResponseStatus(HttpStatus.CREATED)
    public MarketingOptionResponse createOption(@Valid @RequestBody MarketingOptionRequest request) {
        return adminMarketingService.createOption(request);
    }

    @DeleteMapping("/options/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteOption(@PathVariable Long id) {
        adminMarketingService.deleteOption(id);
    }

    @PostMapping("/posts/generate")
    @ResponseStatus(HttpStatus.CREATED)
    public MarketingPostResponse generatePost(
            @Valid @RequestBody MarketingPostRequest request,
            Authentication authentication
    ) {
        return adminMarketingService.generatePost(request, authentication);
    }

    @GetMapping("/posts/{id}")
    public MarketingPostResponse getPost(@PathVariable Long id) {
        return adminMarketingService.getPost(id);
    }

    @PatchMapping("/channels/{id}/content")
    public MarketingPostResponse updateChannelContent(
            @PathVariable Long id,
            @Valid @RequestBody MarketingChannelContentRequest request
    ) {
        return adminMarketingService.updateChannelContent(id, request);
    }

    @PostMapping("/channels/{id}/regenerate-content")
    public MarketingPostResponse regenerateChannelContent(
            @PathVariable Long id,
            @Valid @RequestBody MarketingRegenerateContentRequest request
    ) {
        return adminMarketingService.regenerateChannelContent(id, request);
    }

    @PostMapping("/channels/{id}/schedule")
    public MarketingPostResponse scheduleChannel(
            @PathVariable Long id,
            @Valid @RequestBody ScheduleMarketingChannelRequest request
    ) {
        return adminMarketingService.scheduleChannel(id, request);
    }

    @PostMapping("/channels/{id}/publish")
    public MarketingPostResponse publishChannel(@PathVariable Long id) {
        return adminMarketingService.publishChannel(id);
    }

    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> handleMarketingBadRequest(RuntimeException exception) {
        return Map.of("message", exception.getMessage());
    }
}
