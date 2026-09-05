package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.request.PostCommentReplyRequest;
import com.homestayManagement.homestayManagement.dto.response.PostCommentReplyResponse;
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

class AdminMarketingServiceReplyTest {

    private MarketingPostChannelRepository channelRepository;
    private MarketingNotificationRepository notificationRepository;
    private AdminMarketingServiceImpl service;

    @BeforeEach
    void setUp() {
        channelRepository = mock(MarketingPostChannelRepository.class);
        notificationRepository = mock(MarketingNotificationRepository.class);

        service = new AdminMarketingServiceImpl(
                mock(MarketingPostRepository.class),
                channelRepository,
                mock(MarketingPostMediaRepository.class),
                mock(MarketingCampaignRepository.class),
                mock(SocialAccountRepository.class),
                mock(MarketingOptionRepository.class),
                mock(MarketingContentSuggestionRepository.class),
                mock(MarketingPostMetricRepository.class),
                notificationRepository,
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
    void replyCommentFailsWhenMessageEmpty() {
        assertThrows(IllegalArgumentException.class, () ->
                service.replyComment(1L, "cm_123", new PostCommentReplyRequest("", "Admin"))
        );
    }

    @Test
    void replyCommentFailsWhenChannelNotFound() {
        when(channelRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () ->
                service.replyComment(999L, "cm_123", new PostCommentReplyRequest("Xin chào khách", "Admin"))
        );
    }

    @Test
    void replyCommentSucceedsForFacebook() {
        MarketingPost post = MarketingPost.builder().id(10L).title("Săn Mây Sa Pa").build();
        SocialAccount account = SocialAccount.builder().id(5L).accountName("Lá Đỏ Homestay").build();
        MarketingPostChannel channel = MarketingPostChannel.builder()
                .id(1L)
                .post(post)
                .platform("FACEBOOK")
                .socialAccount(account)
                .externalPostId("fb_post_100")
                .externalUrl("https://facebook.com/fb_post_100")
                .build();

        when(channelRepository.findById(1L)).thenReturn(Optional.of(channel));

        PostCommentReplyResponse response = service.replyComment(
                1L,
                "cm_facebook_99",
                new PostCommentReplyRequest("Chào bạn, homestay còn phòng view thung lũng Mường Hoa nhé ạ!", "Lá Đỏ Homestay Sa Pa")
        );

        assertNotNull(response);
        assertTrue(response.success());
        assertEquals("cm_facebook_99", response.parentCommentId());
        assertEquals("Lá Đỏ Homestay Sa Pa", response.responderName());
        assertEquals("FACEBOOK", response.platform());
        verify(notificationRepository, atLeastOnce()).save(any());
    }

    @Test
    void replyCommentSucceedsForYouTube() {
        MarketingPost post = MarketingPost.builder().id(11L).title("Video Review Phòng").build();
        SocialAccount account = SocialAccount.builder().id(6L).accountName("YouTube Lá Đỏ Official").build();
        MarketingPostChannel channel = MarketingPostChannel.builder()
                .id(2L)
                .post(post)
                .platform("YOUTUBE")
                .socialAccount(account)
                .externalPostId("sapa_vid_200")
                .externalUrl("https://youtube.com/watch?v=sapa_vid_200")
                .build();

        when(channelRepository.findById(2L)).thenReturn(Optional.of(channel));

        PostCommentReplyResponse response = service.replyComment(
                2L,
                "yt_comment_top_level",
                new PostCommentReplyRequest("Cảm ơn bạn đã theo dõi video của Lá Đỏ Homestay!", "Lá Đỏ Homestay Sa Pa")
        );

        assertNotNull(response);
        assertTrue(response.success());
        assertEquals("yt_comment_top_level", response.parentCommentId());
        assertEquals("YOUTUBE", response.platform());
        verify(notificationRepository, atLeastOnce()).save(any());
    }

    @Test
    void detectYouTubeChannelsWithExpiredTokenOrHandle() {
        var list = service.detectYouTubeChannels("ya29.expired_or_invalid_token", "@ladohomestaysapa");
        assertNotNull(list);
        assertFalse(list.isEmpty());
        assertEquals("Lá Đỏ Homestay Sa Pa Official", list.get(0).getName());
        assertTrue(list.get(0).isCanUpload());
        assertEquals("YOUTUBE", list.get(0).getPlatform());
    }
}
