package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.entity.MarketingPostChannel;
import com.homestayManagement.homestayManagement.entity.SocialAccount;
import com.homestayManagement.homestayManagement.repository.MarketingPostMediaRepository;
import com.homestayManagement.homestayManagement.service.impl.MarketingSocialPublisherImpl;
import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.ObjectMapper;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

class MarketingSocialPublisherImplTest {

    private MarketingSocialPublisher publisher(boolean enabled, String apiBaseUrl, String apiKey) {
        return new MarketingSocialPublisherImpl(
                enabled,
                apiBaseUrl,
                apiKey,
                5,
                new ObjectMapper(),
                mock(MarketingPostMediaRepository.class)
        );
    }

    @Test
    void publishFailsWhenRelayIsDisabled() {
        SocialAccount account = SocialAccount.builder()
                .platform("FACEBOOK")
                .accountName("Home Stays")
                .pageUrl("https://facebook.com/home-stays")
                .externalAccountId("aitoearn-account-id")
                .build();
        MarketingPostChannel channel = MarketingPostChannel.builder()
                .platform("FACEBOOK")
                .socialAccount(account)
                .content("Demo content")
                .build();

        MarketingSocialPublisher.PublishResult result = publisher(false, "", "").publish(channel);

        assertFalse(result.success());
        assertEquals("AITOEARN_DISABLED", result.errorCode());
        assertNull(result.externalPostId());
    }

    @Test
    void publishFailsWhenExternalAccountIdIsMissing() {
        SocialAccount account = SocialAccount.builder()
                .platform("FACEBOOK")
                .accountName("Home Stays")
                .pageUrl("https://facebook.com/home-stays")
                .build();
        MarketingPostChannel channel = MarketingPostChannel.builder()
                .platform("FACEBOOK")
                .socialAccount(account)
                .content("Demo content")
                .build();

        MarketingSocialPublisher.PublishResult result = publisher(true, "https://aitoearn.ai/api", "key").publish(channel);

        assertFalse(result.success());
        assertEquals("AITOEARN_ACCOUNT_ID_REQUIRED", result.errorCode());
    }
}
