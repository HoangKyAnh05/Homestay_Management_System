package com.homestayManagement.homestayManagement.config;

import com.homestayManagement.homestayManagement.entity.SocialOAuthApp;
import com.homestayManagement.homestayManagement.repository.SocialOAuthAppRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class SocialOAuthAppSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(SocialOAuthAppSeeder.class);

    private final SocialOAuthAppRepository appRepository;
    private final String facebookClientId;
    private final String facebookClientSecret;
    private final String facebookRedirectUri;
    private final String facebookScopes;

    public SocialOAuthAppSeeder(
            SocialOAuthAppRepository appRepository,
            @Value("${marketing.social.facebook.client-id:}") String facebookClientId,
            @Value("${marketing.social.facebook.client-secret:}") String facebookClientSecret,
            @Value("${marketing.social.facebook.redirect-uri:http://localhost:8080/api/marketing/social/oauth/callback}") String facebookRedirectUri,
            @Value("${marketing.social.facebook.scopes:pages_show_list,pages_read_engagement,pages_manage_posts}") String facebookScopes
    ) {
        this.appRepository = appRepository;
        this.facebookClientId = facebookClientId;
        this.facebookClientSecret = facebookClientSecret;
        this.facebookRedirectUri = facebookRedirectUri;
        this.facebookScopes = facebookScopes;
    }

    @Override
    public void run(ApplicationArguments args) {
        upsertFacebook();
    }

    private void upsertFacebook() {
        if (facebookClientId == null || facebookClientId.isBlank() || facebookClientSecret == null || facebookClientSecret.isBlank()) {
            log.warn("Facebook OAuth is not configured. Missing MARKETING_SOCIAL_FACEBOOK_CLIENT_ID or MARKETING_SOCIAL_FACEBOOK_CLIENT_SECRET.");
            return;
        }
        SocialOAuthApp app = appRepository.findByPlatform("FACEBOOK")
                .orElseGet(() -> SocialOAuthApp.builder().platform("FACEBOOK").active(true).build());
        app.setClientId(facebookClientId);
        app.setClientSecret(facebookClientSecret);
        app.setRedirectUri(facebookRedirectUri);
        app.setScopes(facebookScopes);
        app.setAuthUrl("https://www.facebook.com/v19.0/dialog/oauth");
        app.setTokenUrl("https://graph.facebook.com/v19.0/oauth/access_token");
        app.setActive(true);
        appRepository.save(app);
        log.info("Facebook OAuth app config is loaded into social_oauth_apps.");
    }
}
