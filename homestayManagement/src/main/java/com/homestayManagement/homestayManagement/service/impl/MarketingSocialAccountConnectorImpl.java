package com.homestayManagement.homestayManagement.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.homestayManagement.homestayManagement.dto.request.MarketingSocialAuthStartRequest;
import com.homestayManagement.homestayManagement.dto.response.MarketingConnectedAccountResponse;
import com.homestayManagement.homestayManagement.dto.response.MarketingSocialAuthStartResponse;
import com.homestayManagement.homestayManagement.dto.response.MarketingSocialAuthStatusResponse;
import com.homestayManagement.homestayManagement.entity.SocialAccount;
import com.homestayManagement.homestayManagement.entity.SocialOAuthApp;
import com.homestayManagement.homestayManagement.entity.SocialOAuthSession;
import com.homestayManagement.homestayManagement.repository.SocialAccountRepository;
import com.homestayManagement.homestayManagement.repository.SocialOAuthAppRepository;
import com.homestayManagement.homestayManagement.repository.SocialOAuthSessionRepository;
import com.homestayManagement.homestayManagement.service.MarketingSocialAccountConnector;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class MarketingSocialAccountConnectorImpl implements MarketingSocialAccountConnector {

    private final SocialOAuthAppRepository appRepository;
    private final SocialOAuthSessionRepository sessionRepository;
    private final SocialAccountRepository socialAccountRepository;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String frontendBaseUrl;
    private final String facebookClientId;
    private final String facebookClientSecret;
    private final String facebookRedirectUri;
    private final String facebookScopes;

    public MarketingSocialAccountConnectorImpl(
            SocialOAuthAppRepository appRepository,
            SocialOAuthSessionRepository sessionRepository,
            SocialAccountRepository socialAccountRepository,
            ObjectMapper objectMapper,
            @Value("${app.frontend.base-url:http://localhost:5173}") String frontendBaseUrl,
            @Value("${marketing.social.facebook.client-id:}") String facebookClientId,
            @Value("${marketing.social.facebook.client-secret:}") String facebookClientSecret,
            @Value("${marketing.social.facebook.redirect-uri:http://localhost:8080/api/marketing/social/oauth/callback}") String facebookRedirectUri,
            @Value("${marketing.social.facebook.scopes:pages_show_list,pages_read_engagement,pages_manage_posts}") String facebookScopes
    ) {
        this.appRepository = appRepository;
        this.sessionRepository = sessionRepository;
        this.socialAccountRepository = socialAccountRepository;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newHttpClient();
        this.frontendBaseUrl = trimTrailingSlash(frontendBaseUrl);
        this.facebookClientId = facebookClientId;
        this.facebookClientSecret = facebookClientSecret;
        this.facebookRedirectUri = facebookRedirectUri;
        this.facebookScopes = facebookScopes;
    }

    @Override
    @Transactional
    public MarketingSocialAuthStartResponse startAuth(MarketingSocialAuthStartRequest request) {
        String platform = normalize(request.platform());
        SocialOAuthApp app = resolveOAuthApp(platform);

        String sessionId = "soc_" + UUID.randomUUID().toString().replace("-", "");
        String state = "st_" + UUID.randomUUID().toString().replace("-", "");
        String authUrl = buildAuthUrl(app, state);
        SocialOAuthSession session = SocialOAuthSession.builder()
                .sessionId(sessionId)
                .stateToken(state)
                .platform(platform)
                .status("PENDING")
                .authUrl(authUrl)
                .expiresAt(LocalDateTime.now().plusMinutes(15))
                .build();
        sessionRepository.save(session);
        return new MarketingSocialAuthStartResponse(platform, sessionId, authUrl, session.getExpiresAt().toString());
    }

    @Override
    @Transactional(readOnly = true)
    public MarketingSocialAuthStatusResponse getAuthStatus(String platform, String sessionId) {
        SocialOAuthSession session = sessionRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phiên kết nối social."));
        List<MarketingConnectedAccountResponse> accounts = session.getConnectedAccountId() == null
                ? List.of()
                : socialAccountRepository.findById(session.getConnectedAccountId()).map(account -> List.of(toConnectedAccount(account))).orElse(List.of());
        return new MarketingSocialAuthStatusResponse(
                session.getSessionId(),
                session.getStatus(),
                false,
                session.getExpiresAt() == null ? null : session.getExpiresAt().toString(),
                accounts.isEmpty() ? null : accounts.get(0).accountId(),
                accounts.stream().map(MarketingConnectedAccountResponse::accountId).toList(),
                accounts,
                List.of()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<MarketingConnectedAccountResponse> listAccounts(String platform) {
        return socialAccountRepository.findByActiveTrueOrderByPlatformAscAccountNameAsc().stream()
                .filter(account -> !hasText(platform) || normalize(platform).equals(account.getPlatform()))
                .map(this::toConnectedAccount)
                .toList();
    }

    @Transactional
    public String completeOAuthCallback(String state, String code, String error) {
        SocialOAuthSession session = sessionRepository.findByStateToken(state)
                .orElseThrow(() -> new IllegalArgumentException("Phiên kết nối social không hợp lệ hoặc đã hết hạn."));
        if (hasText(error)) {
            session.setStatus("FAILED");
            session.setErrorMessage(error);
            return frontendRedirect("failed", session.getSessionId());
        }
        if (session.getExpiresAt() != null && session.getExpiresAt().isBefore(LocalDateTime.now())) {
            session.setStatus("EXPIRED");
            session.setErrorMessage("Phiên kết nối đã hết hạn.");
            return frontendRedirect("expired", session.getSessionId());
        }
        SocialOAuthApp app = resolveOAuthApp(session.getPlatform());
        try {
            TokenResponse token = exchangeCodeForToken(app, code);
            SocialAccount account = "FACEBOOK".equals(session.getPlatform())
                    ? createFacebookPageAccount(session.getPlatform(), token.accessToken(), token.expiresIn())
                    : createGenericAccount(session.getPlatform(), token.accessToken(), token.refreshToken(), token.expiresIn());
            session.setStatus("COMPLETED");
            session.setConnectedAccountId(account.getId());
            return frontendRedirect("success", session.getSessionId());
        } catch (RuntimeException exception) {
            session.setStatus("FAILED");
            session.setErrorMessage(exception.getMessage());
            return frontendRedirect("failed", session.getSessionId());
        }
    }

    private SocialAccount createFacebookPageAccount(String platform, String userAccessToken, Long expiresIn) {
        JsonNode pages = facebookGet("/me/accounts", userAccessToken);
        JsonNode data = pages.path("data");
        if (!data.isArray() || data.isEmpty()) {
            return upsertSocialAccount(platform, "Facebook user", null, "me", userAccessToken, null, expiresIn);
        }
        SocialAccount firstSaved = null;
        for (JsonNode page : data) {
            String pageId = text(page, "id", null);
            SocialAccount saved = upsertSocialAccount(
                    platform,
                    text(page, "name", "Facebook Page"),
                    "https://facebook.com/" + text(page, "id", ""),
                    pageId,
                    text(page, "access_token", userAccessToken),
                    null,
                    expiresIn
            );
            if (firstSaved == null) {
                firstSaved = saved;
            }
        }
        return firstSaved;
    }

    private SocialAccount createGenericAccount(String platform, String accessToken, String refreshToken, Long expiresIn) {
        return upsertSocialAccount(platform, platform + " account", null, "me", accessToken, refreshToken, expiresIn);
    }

    private SocialAccount upsertSocialAccount(String platform, String accountName, String pageUrl, String externalAccountId, String accessToken, String refreshToken, Long expiresIn) {
        SocialAccount account = hasText(externalAccountId)
                ? socialAccountRepository.findFirstByPlatformAndExternalAccountId(platform, externalAccountId).orElseGet(SocialAccount::new)
                : new SocialAccount();
        account.setPlatform(platform);
        account.setAccountName(accountName);
        account.setPageUrl(pageUrl);
        account.setExternalAccountId(externalAccountId);
        account.setAccessTokenEncrypted(encodeToken(accessToken));
        account.setRefreshTokenEncrypted(encodeToken(refreshToken));
        account.setTokenExpiresAt(expiresAt(expiresIn));
        account.setActive(true);
        return socialAccountRepository.save(account);
    }

    private TokenResponse exchangeCodeForToken(SocialOAuthApp app, String code) {
        String form = "client_id=" + encode(app.getClientId())
                + "&client_secret=" + encode(app.getClientSecret())
                + "&redirect_uri=" + encode(app.getRedirectUri())
                + "&code=" + encode(code);
        HttpRequest request = HttpRequest.newBuilder(URI.create(app.getTokenUrl()))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(form))
                .build();
        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            JsonNode root = objectMapper.readTree(response.body());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException(text(root, "error_description", text(root.path("error"), "message", "Không đổi được OAuth code lấy token.")));
            }
            return new TokenResponse(text(root, "access_token", null), text(root, "refresh_token", null), root.path("expires_in").isNumber() ? root.path("expires_in").asLong() : null);
        } catch (IOException exception) {
            throw new IllegalStateException("Không đọc được phản hồi OAuth token: " + exception.getMessage(), exception);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Kết nối OAuth token bị gián đoạn.", exception);
        }
    }

    private JsonNode facebookGet(String path, String accessToken) {
        String url = "https://graph.facebook.com/v19.0" + path + "?access_token=" + encode(accessToken);
        try {
            HttpResponse<String> response = httpClient.send(HttpRequest.newBuilder(URI.create(url)).GET().build(), HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            JsonNode root = objectMapper.readTree(response.body());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException(text(root.path("error"), "message", "Không lấy được Facebook pages."));
            }
            return root;
        } catch (IOException exception) {
            throw new IllegalStateException("Không đọc được phản hồi Facebook: " + exception.getMessage(), exception);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Kết nối Facebook bị gián đoạn.", exception);
        }
    }

    private String buildAuthUrl(SocialOAuthApp app, String state) {
        return app.getAuthUrl()
                + "?client_id=" + encode(app.getClientId())
                + "&redirect_uri=" + encode(app.getRedirectUri())
                + "&state=" + encode(state)
                + "&response_type=code"
                + (hasText(app.getScopes()) ? "&scope=" + encode(app.getScopes()) : "");
    }

    private SocialOAuthApp resolveOAuthApp(String platform) {
        return appRepository.findByPlatformAndActiveTrue(platform)
                .orElseGet(() -> fallbackOAuthApp(platform));
    }

    private SocialOAuthApp fallbackOAuthApp(String platform) {
        if ("FACEBOOK".equals(platform) && hasText(facebookClientId) && hasText(facebookClientSecret)) {
            return SocialOAuthApp.builder()
                    .platform("FACEBOOK")
                    .clientId(facebookClientId)
                    .clientSecret(facebookClientSecret)
                    .redirectUri(facebookRedirectUri)
                    .scopes(facebookScopes)
                    .authUrl("https://www.facebook.com/v19.0/dialog/oauth")
                    .tokenUrl("https://graph.facebook.com/v19.0/oauth/access_token")
                    .active(true)
                    .build();
        }
        if ("FACEBOOK".equals(platform)) {
            throw new IllegalStateException("Chưa cấu hình Facebook OAuth. Hãy cấu hình MARKETING_SOCIAL_FACEBOOK_CLIENT_ID và MARKETING_SOCIAL_FACEBOOK_CLIENT_SECRET trong backend .env, hoặc thêm record FACEBOOK vào bảng social_oauth_apps.");
        }
        throw new IllegalStateException("Chưa cấu hình OAuth app cho " + platform + " trong bảng social_oauth_apps.");
    }

    private MarketingConnectedAccountResponse toConnectedAccount(SocialAccount account) {
        return new MarketingConnectedAccountResponse(
                account.getId(),
                account.getExternalAccountId(),
                account.getPlatform(),
                account.getExternalAccountId(),
                account.getAccountName(),
                null,
                account.getPageUrl()
        );
    }

    private String frontendRedirect(String status, String sessionId) {
        return frontendBaseUrl + "/admin/marketing/ai-agent?socialAuthStatus=" + encode(status) + "&sessionId=" + encode(sessionId);
    }

    private LocalDateTime expiresAt(Long expiresIn) {
        return expiresIn == null ? null : LocalDateTime.now().plusSeconds(expiresIn);
    }

    private String encodeToken(String token) {
        return hasText(token) ? Base64.getEncoder().encodeToString(token.getBytes(StandardCharsets.UTF_8)) : null;
    }

    private String text(JsonNode node, String field, String fallback) {
        JsonNode value = node == null ? null : node.get(field);
        return value == null || value.isNull() || !hasText(value.asText()) ? fallback : value.asText();
    }

    private String encode(String value) {
        return URLEncoder.encode(String.valueOf(value == null ? "" : value), StandardCharsets.UTF_8);
    }

    private String normalize(String value) {
        return value == null ? null : value.trim().toUpperCase(Locale.ROOT);
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String trimTrailingSlash(String value) {
        return String.valueOf(value == null ? "" : value).replaceAll("/+$", "");
    }

    private record TokenResponse(String accessToken, String refreshToken, Long expiresIn) {
    }
}
