package com.homestayManagement.homestayManagement.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.homestayManagement.homestayManagement.entity.MarketingPost;
import com.homestayManagement.homestayManagement.entity.MarketingPostChannel;
import com.homestayManagement.homestayManagement.entity.SocialAccount;
import com.homestayManagement.homestayManagement.repository.MarketingPostMediaRepository;
import com.homestayManagement.homestayManagement.service.impl.MarketingDirectSocialPublisherImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class MarketingDirectSocialPublisherImplTest {

    private MarketingPostMediaRepository mediaRepository;
    private MarketingDirectSocialPublisherImpl publisher;

    @BeforeEach
    void setUp() {
        mediaRepository = mock(MarketingPostMediaRepository.class);
        publisher = new MarketingDirectSocialPublisherImpl(
                new ObjectMapper(),
                mediaRepository,
                "http://localhost:8080"
        );
    }

    @Test
    void publishFailsWhenYouTubeTokenIsMissing() {
        SocialAccount account = SocialAccount.builder()
                .platform("YOUTUBE")
                .accountName("Kênh YouTube Lá Đỏ")
                .pageUrl("https://youtube.com/@ladohomestay")
                .accessTokenEncrypted(null)
                .build();

        MarketingPostChannel channel = MarketingPostChannel.builder()
                .platform("YOUTUBE")
                .socialAccount(account)
                .content("Nội dung video")
                .build();

        MarketingSocialPublisher.PublishResult result = publisher.publish(channel);

        assertFalse(result.success());
        assertEquals("SOCIAL_TOKEN_REQUIRED", result.errorCode());
    }

    @Test
    void publishFailsWhenYouTubeVideoIsMissing() {
        SocialAccount account = SocialAccount.builder()
                .platform("YOUTUBE")
                .accountName("Kênh YouTube Lá Đỏ")
                .pageUrl("https://youtube.com/@ladohomestay")
                .accessTokenEncrypted("{encrypted-placeholder}ya29.test_token")
                .build();

        MarketingPost post = MarketingPost.builder()
                .id(99L)
                .title("Trải nghiệm săn mây")
                .build();

        MarketingPostChannel channel = MarketingPostChannel.builder()
                .platform("YOUTUBE")
                .socialAccount(account)
                .post(post)
                .content("Săn mây cực chill tại Sa Pa")
                .build();

        when(mediaRepository.findByPostIdOrderByDisplayOrderAsc(99L)).thenReturn(List.of());

        MarketingSocialPublisher.PublishResult result = publisher.publish(channel);

        assertFalse(result.success());
        assertEquals("YOUTUBE_VIDEO_REQUIRED", result.errorCode());
        assertTrue(result.errorMessage().contains("YouTube chỉ hỗ trợ xuất bản tệp Video"));
    }
}
