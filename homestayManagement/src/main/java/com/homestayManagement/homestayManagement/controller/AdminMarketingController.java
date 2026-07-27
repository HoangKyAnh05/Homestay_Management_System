package com.homestayManagement.homestayManagement.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.homestayManagement.homestayManagement.dto.request.MarketingOptionRequest;
import com.homestayManagement.homestayManagement.dto.request.MarketingChannelContentRequest;
import com.homestayManagement.homestayManagement.dto.request.MarketingMediaRequest;
import com.homestayManagement.homestayManagement.dto.request.MarketingPostRequest;
import com.homestayManagement.homestayManagement.dto.request.MarketingRegenerateContentRequest;
import com.homestayManagement.homestayManagement.dto.request.MarketingSocialAuthStartRequest;
import com.homestayManagement.homestayManagement.dto.request.ScheduleMarketingChannelRequest;
import com.homestayManagement.homestayManagement.dto.request.SocialAccountRequest;
import com.homestayManagement.homestayManagement.dto.request.VoucherRequest;
import com.homestayManagement.homestayManagement.dto.response.MarketingConnectedAccountResponse;
import com.homestayManagement.homestayManagement.dto.response.MarketingDashboardResponse;
import com.homestayManagement.homestayManagement.dto.response.MarketingMediaUploadResponse;
import com.homestayManagement.homestayManagement.dto.response.MarketingOptionResponse;
import com.homestayManagement.homestayManagement.dto.response.MarketingPostResponse;
import com.homestayManagement.homestayManagement.dto.response.MarketingSocialAuthStartResponse;
import com.homestayManagement.homestayManagement.dto.response.MarketingSocialAuthStatusResponse;
import com.homestayManagement.homestayManagement.dto.response.SocialAccountResponse;
import com.homestayManagement.homestayManagement.dto.response.VoucherResponse;
import com.homestayManagement.homestayManagement.service.AdminMarketingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.io.IOException;
import java.io.OutputStream;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/marketing")
public class AdminMarketingController {

    private final AdminMarketingService adminMarketingService;
    private final ObjectMapper objectMapper;

    public AdminMarketingController(AdminMarketingService adminMarketingService, ObjectMapper objectMapper) {
        this.adminMarketingService = adminMarketingService;
        this.objectMapper = objectMapper;
    }

    @GetMapping("/dashboard")
    public MarketingDashboardResponse dashboard() {
        return adminMarketingService.dashboard();
    }

    @GetMapping("/vouchers")
    public List<VoucherResponse> listVouchers() {
        return adminMarketingService.listVouchers();
    }

    @GetMapping("/vouchers/{id}")
    public VoucherResponse getVoucher(@PathVariable Long id) {
        return adminMarketingService.getVoucher(id);
    }

    @PostMapping("/vouchers")
    @ResponseStatus(HttpStatus.CREATED)
    public VoucherResponse createVoucher(@Valid @RequestBody VoucherRequest request) {
        return adminMarketingService.createVoucher(request);
    }

    @PutMapping("/vouchers/{id}")
    public VoucherResponse updateVoucher(
            @PathVariable Long id,
            @Valid @RequestBody VoucherRequest request
    ) {
        return adminMarketingService.updateVoucher(id, request);
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

    @PostMapping(value = "/posts/generate/stream", produces = MediaType.APPLICATION_NDJSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public StreamingResponseBody generatePostStream(
            @Valid @RequestBody MarketingPostRequest request,
            Authentication authentication
    ) {
        return outputStream -> {
            try {
                writeEvent(outputStream, "meta", Map.of("title", request.title()));
                MarketingPostResponse post = adminMarketingService.generatePostStream(request, authentication, delta -> {
                    try {
                        writeEvent(outputStream, "delta", Map.of("text", delta));
                    } catch (IOException exception) {
                        throw new MarketingStreamWriteException(exception);
                    }
                });
                writeEvent(outputStream, "done", Map.of("post", post));
            } catch (MarketingStreamWriteException exception) {
                throw exception;
            } catch (Exception exception) {
                writeEvent(outputStream, "error", Map.of("message", safeMessage(exception)));
            }
        };
    }

    @GetMapping("/posts/{id}")
    public MarketingPostResponse getPost(@PathVariable Long id) {
        return adminMarketingService.getPost(id);
    }

    @PatchMapping("/posts/{id}/media")
    public MarketingPostResponse updatePostMedia(
            @PathVariable Long id,
            @Valid @RequestBody List<MarketingMediaRequest> media
    ) {
        return adminMarketingService.updatePostMedia(id, media);
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

    private void writeEvent(OutputStream outputStream, String type, Map<String, ?> payload) throws IOException {
        objectMapper.writeValue(outputStream, Map.of("type", type, "payload", payload));
        outputStream.write('\n');
        outputStream.flush();
    }

    private String safeMessage(Exception exception) {
        return exception.getMessage() == null ? "Không thể tạo nội dung marketing." : exception.getMessage();
    }

    private static final class MarketingStreamWriteException extends RuntimeException {
        private MarketingStreamWriteException(Throwable cause) {
            super(cause);
        }
    }
}
