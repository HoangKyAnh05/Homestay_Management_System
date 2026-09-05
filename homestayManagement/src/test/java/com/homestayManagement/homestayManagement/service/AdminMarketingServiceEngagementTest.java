package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.response.PostEngagementMetricsResponse;
import com.homestayManagement.homestayManagement.entity.MarketingPost;
import com.homestayManagement.homestayManagement.entity.MarketingPostChannel;
import com.homestayManagement.homestayManagement.entity.SocialAccount;
import com.homestayManagement.homestayManagement.repository.*;
import com.homestayManagement.homestayManagement.service.impl.AdminMarketingServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AdminMarketingServiceEngagementTest {

    private MarketingPostChannelRepository channelRepository;
    private SocialAccountRepository socialAccountRepository;
    private MarketingPostMetricRepository metricRepository;
    private AdminMarketingServiceImpl service;

    @BeforeEach
    void setUp() {
        channelRepository = mock(MarketingPostChannelRepository.class);
        socialAccountRepository = mock(SocialAccountRepository.class);
        metricRepository = mock(MarketingPostMetricRepository.class);

        service = new AdminMarketingServiceImpl(
                mock(MarketingPostRepository.class),
                channelRepository,
                mock(MarketingPostMediaRepository.class),
                mock(MarketingCampaignRepository.class),
                socialAccountRepository,
                mock(MarketingOptionRepository.class),
                mock(MarketingContentSuggestionRepository.class),
                metricRepository,
                mock(MarketingNotificationRepository.class),
                mock(MarketingPublishAttemptRepository.class),
                mock(AiAgentConfigRepository.class),
                mock(AiGenerationLogRepository.class),
                mock(EmployeeRepository.class),
                mock(VoucherRepository.class),
                mock(MarketingAiTextGenerator.class),
                mock(MarketingSocialPublisher.class),
                mock(MarketingSocialAccountConnector.class)
        );
    }

    @Test
    void getEngagementFailsWhenChannelNotFound() {
        when(channelRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> service.getChannelEngagement(999L));
    }

    @Test
    void getEngagementFailsWhenExternalPostIdMissing() {
        MarketingPostChannel channel = MarketingPostChannel.builder()
                .id(1L)
                .platform("FACEBOOK")
                .status("PUBLISHED")
                .externalPostId(null)
                .build();

        when(channelRepository.findById(1L)).thenReturn(Optional.of(channel));

        assertThrows(IllegalArgumentException.class, () -> service.getChannelEngagement(1L));
    }

    @Test
    void getEngagementSuccessInitialStateWhenExternalPostIdPresent() {
        SocialAccount account = SocialAccount.builder()
                .platform("YOUTUBE")
                .accessTokenEncrypted(null)
                .build();

        MarketingPostChannel channel = MarketingPostChannel.builder()
                .id(2L)
                .platform("YOUTUBE")
                .pageName("Lá Đỏ Channel")
                .status("PUBLISHED")
                .externalPostId("sample_video_id")
                .externalUrl("https://youtube.com/watch?v=sample_video_id")
                .socialAccount(account)
                .build();

        when(channelRepository.findById(2L)).thenReturn(Optional.of(channel));

        PostEngagementMetricsResponse response = service.getChannelEngagement(2L);

        assertNotNull(response);
        assertEquals(2L, response.getChannelId());
        assertEquals("YOUTUBE", response.getPlatform());
        assertEquals("sample_video_id", response.getExternalPostId());
        assertNotNull(response.getSyncedAt());
    }
}
