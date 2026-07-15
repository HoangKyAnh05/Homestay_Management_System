package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.request.*;
import com.homestayManagement.homestayManagement.dto.response.*;
import com.homestayManagement.homestayManagement.entity.*;
import com.homestayManagement.homestayManagement.repository.*;
import com.homestayManagement.homestayManagement.service.AdminMarketingService;
import com.homestayManagement.homestayManagement.service.MarketingAiTextGenerator;
import com.homestayManagement.homestayManagement.service.MarketingSocialAccountConnector;
import com.homestayManagement.homestayManagement.service.MarketingSocialPublisher;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class AdminMarketingServiceImpl implements AdminMarketingService {

    private static final Path MARKETING_UPLOAD_DIR = Paths.get("uploads", "marketing").toAbsolutePath().normalize();

    private static final List<String> DEFAULT_GOALS = List.of(
            "Tăng nhận diện thương hiệu",
            "Thu hút lượt đặt phòng",
            "Quảng bá ưu đãi",
            "Tăng tương tác cộng đồng"
    );
    private static final List<String> DEFAULT_TONES = List.of(
            "Ấm áp & truyền cảm hứng",
            "Trẻ trung & gần gũi",
            "Sang trọng & tinh tế",
            "Hài hước & bắt trend"
    );

    private final MarketingPostRepository postRepository;
    private final MarketingPostChannelRepository channelRepository;
    private final MarketingPostMediaRepository mediaRepository;
    private final MarketingCampaignRepository campaignRepository;
    private final SocialAccountRepository socialAccountRepository;
    private final MarketingOptionRepository optionRepository;
    private final MarketingContentSuggestionRepository suggestionRepository;
    private final MarketingPostMetricRepository metricRepository;
    private final MarketingPublishAttemptRepository attemptRepository;
    private final AiAgentConfigRepository agentConfigRepository;
    private final AiGenerationLogRepository generationLogRepository;
    private final EmployeeRepository employeeRepository;
    private final MarketingAiTextGenerator aiTextGenerator;
    private final MarketingSocialPublisher socialPublisher;
    private final MarketingSocialAccountConnector socialAccountConnector;

    public AdminMarketingServiceImpl(
            MarketingPostRepository postRepository,
            MarketingPostChannelRepository channelRepository,
            MarketingPostMediaRepository mediaRepository,
            MarketingCampaignRepository campaignRepository,
            SocialAccountRepository socialAccountRepository,
            MarketingOptionRepository optionRepository,
            MarketingContentSuggestionRepository suggestionRepository,
            MarketingPostMetricRepository metricRepository,
            MarketingPublishAttemptRepository attemptRepository,
            AiAgentConfigRepository agentConfigRepository,
            AiGenerationLogRepository generationLogRepository,
            EmployeeRepository employeeRepository,
            MarketingAiTextGenerator aiTextGenerator,
            MarketingSocialPublisher socialPublisher,
            MarketingSocialAccountConnector socialAccountConnector
    ) {
        this.postRepository = postRepository;
        this.channelRepository = channelRepository;
        this.mediaRepository = mediaRepository;
        this.campaignRepository = campaignRepository;
        this.socialAccountRepository = socialAccountRepository;
        this.optionRepository = optionRepository;
        this.suggestionRepository = suggestionRepository;
        this.metricRepository = metricRepository;
        this.attemptRepository = attemptRepository;
        this.agentConfigRepository = agentConfigRepository;
        this.generationLogRepository = generationLogRepository;
        this.employeeRepository = employeeRepository;
        this.aiTextGenerator = aiTextGenerator;
        this.socialPublisher = socialPublisher;
        this.socialAccountConnector = socialAccountConnector;
    }

    @Override
    @Transactional
    public MarketingDashboardResponse dashboard() {
        ensureDefaultOptions("GOAL", DEFAULT_GOALS);
        ensureDefaultOptions("TONE", DEFAULT_TONES);
        return new MarketingDashboardResponse(
                postRepository.countByStatus("DRAFT"),
                channelRepository.countByStatus("SCHEDULED"),
                channelRepository.countByStatus("PUBLISHED"),
                channelRepository.countByStatus("FAILED"),
                safeLong(metricRepository.totalReach()),
                BigDecimal.valueOf(metricRepository.averageEngagementRateSafe()),
                activeUniqueSocialAccounts().stream().map(this::toSocialAccountResponse).toList(),
                optionRepository.findByOptionTypeAndActiveTrueOrderByIdAsc("GOAL").stream().map(this::toOptionResponse).toList(),
                optionRepository.findByOptionTypeAndActiveTrueOrderByIdAsc("TONE").stream().map(this::toOptionResponse).toList(),
                suggestions().stream().map(this::toSuggestionResponse).toList(),
                postRepository.findTop50ByOrderByCreatedAtDesc().stream().map(this::toPostResponse).toList()
        );
    }

    @Override
    @Transactional
    public SocialAccountResponse createSocialAccount(SocialAccountRequest request, Authentication authentication) {
        String platform = normalize(request.platform());
        String externalAccountId = clean(request.externalAccountId());
        SocialAccount account = hasText(externalAccountId)
                ? socialAccountRepository.findFirstByPlatformAndExternalAccountId(platform, externalAccountId)
                .orElseGet(SocialAccount::new)
                : findExistingManualAccount(platform, request).orElseGet(SocialAccount::new);
        account.setPlatform(platform);
        account.setAccountName(request.accountName().trim());
        account.setPageUrl(clean(request.pageUrl()));
        account.setExternalAccountId(externalAccountId);
        if (hasText(request.accessToken())) {
            account.setAccessTokenEncrypted(maskToken(request.accessToken()));
        }
        if (hasText(request.refreshToken())) {
            account.setRefreshTokenEncrypted(maskToken(request.refreshToken()));
        }
        if (request.tokenExpiresAt() != null) {
            account.setTokenExpiresAt(request.tokenExpiresAt());
        }
        if (account.getConnectedBy() == null) {
            account.setConnectedBy(currentEmployee(authentication));
        }
        account.setActive(true);
        return toSocialAccountResponse(socialAccountRepository.save(account));
    }

    @Override
    @Transactional
    public void deleteSocialAccount(Long id) {
        SocialAccount account = socialAccountRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy social account."));
        account.setActive(false);
    }

    @Override
    public MarketingSocialAuthStartResponse startSocialAuth(MarketingSocialAuthStartRequest request) {
        return socialAccountConnector.startAuth(request);
    }

    @Override
    public MarketingSocialAuthStatusResponse getSocialAuthStatus(String platform, String sessionId) {
        return socialAccountConnector.getAuthStatus(platform, sessionId);
    }

    @Override
    public List<MarketingConnectedAccountResponse> listConnectedSocialAccounts(String platform) {
        return socialAccountConnector.listAccounts(platform);
    }

    @Override
    public MarketingMediaUploadResponse uploadMedia(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng chọn ảnh hoặc video để tải lên.");
        }
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        String mediaType;
        if (contentType.startsWith("image/")) {
            mediaType = "IMAGE";
        } else if (contentType.startsWith("video/")) {
            mediaType = "VIDEO";
        } else {
            throw new IllegalArgumentException("Chỉ hỗ trợ file ảnh hoặc video.");
        }
        String originalName = file.getOriginalFilename() == null ? "media" : file.getOriginalFilename();
        String filename = "marketing_" + UUID.randomUUID().toString().replace("-", "") + extensionOf(originalName, mediaType);
        Path target = MARKETING_UPLOAD_DIR.resolve(filename).normalize();
        Files.createDirectories(target.getParent());
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        return new MarketingMediaUploadResponse(
                "/uploads/marketing/" + filename,
                mediaType,
                originalName,
                file.getSize()
        );
    }

    @Override
    @Transactional
    public MarketingOptionResponse createOption(MarketingOptionRequest request) {
        String type = normalize(request.optionType());
        String label = request.label().trim();
        MarketingOption option = optionRepository.findByOptionTypeAndLabelIgnoreCase(type, label)
                .map(existing -> {
                    existing.setActive(true);
                    return existing;
                })
                .orElseGet(() -> MarketingOption.builder().optionType(type).label(label).active(true).build());
        return toOptionResponse(optionRepository.save(option));
    }

    @Override
    @Transactional
    public void deleteOption(Long id) {
        MarketingOption option = optionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy option."));
        option.setActive(false);
    }

    @Override
    @Transactional
    public MarketingPostResponse generatePost(MarketingPostRequest request, Authentication authentication) {
        Employee creator = currentEmployee(authentication);
        AiAgentConfig agentConfig = agentConfigRepository.findFirstByIsActiveTrueOrderByIdAsc().orElse(null);
        MarketingPost post = MarketingPost.builder()
                .campaign(request.campaignId() == null ? null : campaignRepository.findById(request.campaignId()).orElse(null))
                .title(request.title().trim())
                .brief(request.brief().trim())
                .goal(request.goal().trim())
                .tone(request.tone().trim())
                .contentLength(normalizeContentLength(request.contentLength()))
                .sourceType("AI_GENERATED")
                .status("DRAFT")
                .approvalStatus("PENDING")
                .creator(creator)
                .agentConfig(agentConfig)
                .build();
        MarketingPost savedPost = postRepository.save(post);

        String aiOutput = generateWithAi(request, agentConfig);
        generationLogRepository.save(AiGenerationLog.builder()
                .post(savedPost)
                .agentConfig(agentConfig)
                .inputBrief(request.brief())
                .inputGoal(request.goal())
                .inputTone(request.tone())
                .outputJson(aiOutput)
                .provider(agentConfig == null ? "customer-ai-sidecar" : agentConfig.getProvider())
                .modelName(agentConfig == null ? null : agentConfig.getModelName())
                .status("SUCCESS")
                .createdBy(creator)
                .build());

        for (MarketingChannelRequest channelRequest : request.channels()) {
            SocialAccount account = channelRequest.socialAccountId() == null
                    ? null
                    : socialAccountRepository.findById(channelRequest.socialAccountId()).orElse(null);
            String content = hasText(channelRequest.content())
                    ? channelRequest.content().trim()
                    : channelCopy(aiOutput, request, channelRequest.platform(), account);
            MarketingPostChannel channel = MarketingPostChannel.builder()
                    .post(savedPost)
                    .socialAccount(account)
                    .platform(normalize(channelRequest.platform()))
                    .pageName(hasText(channelRequest.pageName()) ? channelRequest.pageName().trim() : accountName(account))
                    .pageUrl(hasText(channelRequest.pageUrl()) ? channelRequest.pageUrl().trim() : accountUrl(account))
                    .content(content)
                    .hashtags(channelRequest.hashtags())
                    .platformOptionJson(clean(channelRequest.platformOptionJson()))
                    .scheduledAt(channelRequest.scheduledAt())
                    .status(channelRequest.scheduledAt() == null ? "DRAFT" : "SCHEDULED")
                    .build();
            channelRepository.save(channel);
        }

        if (request.media() != null) {
            int index = 1;
            for (MarketingMediaRequest mediaRequest : request.media()) {
                mediaRepository.save(MarketingPostMedia.builder()
                        .post(savedPost)
                        .mediaUrl(mediaRequest.mediaUrl())
                        .mediaType(normalize(mediaRequest.mediaType()))
                        .displayOrder(mediaRequest.displayOrder() == null ? index : mediaRequest.displayOrder())
                        .altText(mediaRequest.altText())
                        .source(mediaRequest.source())
                        .build());
                index++;
            }
        }
        return getPost(savedPost.getId());
    }

    @Override
    @Transactional
    public MarketingPostResponse updateChannelContent(Long channelId, MarketingChannelContentRequest request) {
        MarketingPostChannel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy kênh đăng bài."));
        channel.setContent(request.content().trim());
        channel.setHashtags(clean(request.hashtags()));
        return getPost(channel.getPost().getId());
    }

    @Override
    @Transactional
    public MarketingPostResponse regenerateChannelContent(Long channelId, MarketingRegenerateContentRequest request) {
        MarketingPostChannel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy kênh đăng bài."));
        MarketingPost post = channel.getPost();
        String instruction = request.instruction().trim();
        MarketingPostRequest aiRequest = new MarketingPostRequest(
                post.getCampaign() == null ? null : post.getCampaign().getId(),
                post.getTitle(),
                """
                %s

                Yêu cầu tạo lại từ người dùng: %s
                Hãy viết một phiên bản hoàn toàn mới, tránh lặp lại nội dung cũ sau đây:
                %s
                """.formatted(post.getBrief(), instruction, channel.getContent() == null ? "" : channel.getContent()).trim(),
                post.getGoal(),
                post.getTone(),
                null,
                List.of(new MarketingChannelRequest(
                        channel.getSocialAccount() == null ? null : channel.getSocialAccount().getId(),
                        channel.getPlatform(),
                        channel.getPageName(),
                        channel.getPageUrl(),
                        null,
                        null,
                        channel.getPlatformOptionJson(),
                        channel.getScheduledAt()
                )),
                List.of()
        );
        String aiOutput = generateWithAi(aiRequest, post.getAgentConfig());
        channel.setContent(channelCopy(aiOutput, aiRequest, channel.getPlatform(), channel.getSocialAccount()));
        channel.setErrorMessage(null);
        generationLogRepository.save(AiGenerationLog.builder()
                .post(post)
                .agentConfig(post.getAgentConfig())
                .inputBrief(aiRequest.brief())
                .inputGoal(post.getGoal())
                .inputTone(post.getTone())
                .outputJson(aiOutput)
                .provider(post.getAgentConfig() == null ? "openai" : post.getAgentConfig().getProvider())
                .modelName(post.getAgentConfig() == null ? null : post.getAgentConfig().getModelName())
                .status("SUCCESS")
                .build());
        return getPost(post.getId());
    }

    @Override
    @Transactional
    public MarketingPostResponse scheduleChannel(Long channelId, ScheduleMarketingChannelRequest request) {
        MarketingPostChannel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy kênh đăng bài."));
        channel.setScheduledAt(request.scheduledAt());
        channel.setStatus("SCHEDULED");
        channel.getPost().setStatus("SCHEDULED");
        return getPost(channel.getPost().getId());
    }

    @Override
    @Transactional
    public MarketingPostResponse publishChannel(Long channelId) {
        MarketingPostChannel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy kênh đăng bài."));
        attachSocialAccountIfMissing(channel);
        long attemptNo = attemptRepository.countByChannelId(channelId) + 1;
        MarketingSocialPublisher.PublishResult result = socialPublisher.publish(channel);
        attemptRepository.save(MarketingPublishAttempt.builder()
                .channel(channel)
                .attemptNo((int) attemptNo)
                .requestPayload("{\"channelId\":" + channelId + ",\"platform\":\"" + channel.getPlatform() + "\"}")
                .responsePayload(result.responsePayload())
                .status(result.success() ? "SUCCESS" : "FAILED")
                .errorCode(result.errorCode())
                .errorMessage(result.errorMessage())
                .build());
        if (result.success()) {
            if (hasText(result.generatedContent())) {
                channel.setContent(result.generatedContent().trim());
            }
            if (hasText(result.generatedHashtags())) {
                channel.setHashtags(result.generatedHashtags().trim());
            }
            channel.setStatus(result.status() == null ? "PUBLISHING" : result.status());
            if ("PUBLISHED".equals(channel.getStatus())) {
                channel.setPostedAt(LocalDateTime.now());
            }
            channel.setRelayFlowId(result.relayFlowId());
            channel.setRelayTaskId(result.relayTaskId());
            channel.setExternalPostId(result.externalPostId());
            channel.setExternalUrl(result.externalUrl());
            channel.setErrorMessage(null);
            channel.getPost().setStatus(channel.getStatus());
        } else {
            channel.setStatus("FAILED");
            channel.setErrorMessage(result.errorMessage());
            channel.getPost().setStatus("FAILED");
        }
        return getPost(channel.getPost().getId());
    }

    private void attachSocialAccountIfMissing(MarketingPostChannel channel) {
        if (channel.getSocialAccount() != null) {
            return;
        }
        String platform = normalize(channel.getPlatform());
        SocialAccount account = null;
        if (hasText(channel.getPageUrl())) {
            account = socialAccountRepository.findFirstByPlatformAndPageUrlAndActiveTrue(platform, channel.getPageUrl().trim()).orElse(null);
        }
        if (account == null && hasText(channel.getPageName())) {
            account = socialAccountRepository.findFirstByPlatformAndAccountNameIgnoreCaseAndActiveTrue(platform, channel.getPageName().trim()).orElse(null);
        }
        if (account == null) {
            account = socialAccountRepository.findFirstByPlatformAndActiveTrueOrderByIdAsc(platform).orElse(null);
        }
        if (account != null) {
            channel.setSocialAccount(account);
            channel.setPageName(accountName(account));
            channel.setPageUrl(accountUrl(account));
        }
    }

    private java.util.Optional<SocialAccount> findExistingManualAccount(String platform, SocialAccountRequest request) {
        if (hasText(request.pageUrl())) {
            java.util.Optional<SocialAccount> byPageUrl = socialAccountRepository.findFirstByPlatformAndPageUrlAndActiveTrue(platform, request.pageUrl().trim());
            if (byPageUrl.isPresent()) {
                return byPageUrl;
            }
        }
        if (hasText(request.accountName())) {
            return socialAccountRepository.findFirstByPlatformAndAccountNameIgnoreCaseAndActiveTrue(platform, request.accountName().trim());
        }
        return java.util.Optional.empty();
    }

    @Override
    @Transactional(readOnly = true)
    public MarketingPostResponse getPost(Long postId) {
        MarketingPost post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài đăng."));
        return toPostResponse(post);
    }

    private List<MarketingContentSuggestion> suggestions() {
        List<MarketingContentSuggestion> persisted = suggestionRepository.findTop6ByStatusOrderByCreatedAtDesc("NEW");
        if (!persisted.isEmpty()) {
            return persisted;
        }
        return List.of(
                MarketingContentSuggestion.builder().id(0L).title("Ưu đãi lấp đầy ngày thường").description("Tạo bài nhấn mạnh lợi ích đặt phòng từ Thứ 2 - Thứ 5.").suggestionType("VOUCHER").status("NEW").build(),
                MarketingContentSuggestion.builder().id(0L).title("Một ngày tại Home Stays").description("Gợi ý video/reels hậu trường để tăng cảm giác gần gũi.").suggestionType("REELS").status("NEW").build(),
                MarketingContentSuggestion.builder().id(0L).title("Review từ khách hàng").description("Biến phản hồi tích cực thành bài đăng tạo niềm tin.").suggestionType("COMMUNITY").status("NEW").build()
        );
    }

    private List<SocialAccount> activeUniqueSocialAccounts() {
        Map<String, SocialAccount> unique = new LinkedHashMap<>();
        for (SocialAccount account : socialAccountRepository.findByActiveTrueOrderByPlatformAscAccountNameAsc()) {
            String key = account.getPlatform() + ":" + (hasText(account.getExternalAccountId())
                    ? account.getExternalAccountId()
                    : hasText(account.getPageUrl()) ? account.getPageUrl() : account.getAccountName());
            unique.putIfAbsent(key, account);
        }
        return List.copyOf(unique.values());
    }

    private String generateWithAi(MarketingPostRequest request, AiAgentConfig agentConfig) {
        MarketingAiTextGenerator.GenerationResult result = aiTextGenerator.generate(request);
        if (result.success() && hasText(result.content())) {
            return result.content();
        }
        throw new IllegalStateException(hasText(result.errorMessage())
                ? result.errorMessage()
                : "AI không tạo được nội dung. Hãy kiểm tra cấu hình OpenAI API key/model.");
        /*
        String prompt = """
                Bạn là AI marketing cho homestay. Hãy viết nội dung đăng mạng xã hội bằng tiếng Việt.
                Mục tiêu: %s
                Giọng điệu: %s
                Brief: %s
                Trả lời ngắn gọn, có CTA và hashtag phù hợp.
                """.formatted(request.goal(), request.tone(), request.brief());
        try {
            CustomerAiClient.CustomerAiClientResponse response = customerAiClient.chat(
                    new CustomerAiClient.CustomerAiClientRequest(
                            prompt,
                            "marketing-post-agent",
                            "/admin/marketing/ai-agent",
                            "marketing",
                            true,
                            Map.of("agentConfig", agentConfig == null ? "default" : agentConfig.getAgentName()),
                            null,
                            List.of()
                    )
            );
            if (hasText(response.answer())) {
                return response.answer();
            }
        } catch (RuntimeException ignored) {
            // Fallback below keeps the workflow usable if the AI sidecar/provider is unavailable.
        }
        return fallbackCopy(request);
        */
    }

    private String channelCopy(String aiOutput, MarketingPostRequest request, String platform, SocialAccount account) {
        String platformLabel = normalize(platform);
        String page = accountName(account);
        return """
                %s

                Gợi ý tối ưu cho %s%s.
                #HomeStays #HomestayVietNam #DuLichNghiDuong
                """.formatted(aiOutput.trim(), platformLabel, page == null ? "" : " · " + page).trim();
    }

    private String fallbackCopy(MarketingPostRequest request) {
        return """
                Đôi khi, điều khách cần chỉ là một khoảng nghỉ thật chậm.

                %s

                Home Stays luôn sẵn sàng cho những ngày nghỉ nhiều cảm hứng. Đặt phòng hôm nay để giữ lịch đẹp nhất.
                #HomeStays #NghiDuong #TravelVietnam
                """.formatted(request.brief()).trim();
    }

    private MarketingPostResponse toPostResponse(MarketingPost post) {
        return new MarketingPostResponse(
                post.getId(),
                post.getTitle(),
                post.getBrief(),
                post.getGoal(),
                post.getTone(),
                post.getContentLength(),
                post.getStatus(),
                post.getApprovalStatus(),
                post.getSourceType(),
                post.getCreatedAt(),
                channelRepository.findByPostIdOrderByIdAsc(post.getId()).stream().map(this::toChannelResponse).toList(),
                mediaRepository.findByPostIdOrderByDisplayOrderAsc(post.getId()).stream().map(this::toMediaResponse).toList()
        );
    }

    private MarketingChannelResponse toChannelResponse(MarketingPostChannel channel) {
        return new MarketingChannelResponse(
                channel.getId(),
                channel.getSocialAccount() == null ? null : channel.getSocialAccount().getId(),
                channel.getPlatform(),
                channel.getPageName(),
                channel.getPageUrl(),
                channel.getContent(),
                channel.getHashtags(),
                channel.getPlatformOptionJson(),
                channel.getRelayFlowId(),
                channel.getRelayTaskId(),
                channel.getScheduledAt(),
                channel.getPostedAt(),
                channel.getStatus(),
                channel.getExternalPostId(),
                channel.getExternalUrl(),
                channel.getErrorMessage()
        );
    }

    private MarketingMediaResponse toMediaResponse(MarketingPostMedia media) {
        return new MarketingMediaResponse(media.getId(), media.getMediaUrl(), media.getMediaType(), media.getDisplayOrder(), media.getAltText(), media.getSource());
    }

    private SocialAccountResponse toSocialAccountResponse(SocialAccount account) {
        return new SocialAccountResponse(account.getId(), account.getPlatform(), account.getAccountName(), account.getPageUrl(), account.getExternalAccountId(), account.isActive(), account.getTokenExpiresAt());
    }

    private MarketingOptionResponse toOptionResponse(MarketingOption option) {
        return new MarketingOptionResponse(option.getId(), option.getOptionType(), option.getLabel());
    }

    private MarketingSuggestionResponse toSuggestionResponse(MarketingContentSuggestion suggestion) {
        return new MarketingSuggestionResponse(suggestion.getId(), suggestion.getTitle(), suggestion.getDescription(), suggestion.getSuggestionType(), suggestion.getStatus());
    }

    private Employee currentEmployee(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return null;
        }
        return employeeRepository.findByAccountEmail(authentication.getName()).orElse(null);
    }

    private void ensureDefaultOptions(String type, List<String> labels) {
        if (!optionRepository.findByOptionTypeAndActiveTrueOrderByIdAsc(type).isEmpty()) {
            return;
        }
        labels.forEach(label -> optionRepository.save(MarketingOption.builder().optionType(type).label(label).active(true).build()));
    }

    private String accountName(SocialAccount account) {
        return account == null ? null : account.getAccountName();
    }

    private String accountUrl(SocialAccount account) {
        return account == null ? null : account.getPageUrl();
    }

    private String maskToken(String token) {
        if (!hasText(token)) {
            return null;
        }
        return "{encrypted-placeholder}" + token.trim();
    }

    private String extensionOf(String originalName, String mediaType) {
        String safeName = originalName == null ? "" : originalName;
        int dot = safeName.lastIndexOf('.');
        if (dot >= 0 && dot < safeName.length() - 1) {
            String extension = safeName.substring(dot).toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9.]", "");
            if (extension.length() <= 12) {
                return extension;
            }
        }
        return "VIDEO".equals(mediaType) ? ".mp4" : ".jpg";
    }

    private String clean(String value) {
        return hasText(value) ? value.trim() : null;
    }

    private String normalize(String value) {
        return value == null ? null : value.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeContentLength(String value) {
        if (!hasText(value)) {
            return "STANDARD";
        }
        String normalized = value.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case "LONGER", "SHORTER", "CONCISE" -> normalized;
            default -> "STANDARD";
        };
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private long safeLong(Long value) {
        return value == null ? 0L : value;
    }
}
