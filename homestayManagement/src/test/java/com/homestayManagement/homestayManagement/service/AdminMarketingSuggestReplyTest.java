package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.request.SuggestCommentReplyRequest;
import com.homestayManagement.homestayManagement.dto.response.SuggestCommentReplyResponse;
import com.homestayManagement.homestayManagement.repository.*;
import com.homestayManagement.homestayManagement.service.impl.AdminMarketingServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AdminMarketingSuggestReplyTest {

    private AdminMarketingServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new AdminMarketingServiceImpl(
                mock(MarketingPostRepository.class),
                mock(MarketingPostChannelRepository.class),
                mock(MarketingPostMediaRepository.class),
                mock(MarketingCampaignRepository.class),
                mock(SocialAccountRepository.class),
                mock(MarketingOptionRepository.class),
                mock(MarketingContentSuggestionRepository.class),
                mock(MarketingPostMetricRepository.class),
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
    void suggestReplyFailsWhenCommentIsBlank() {
        SuggestCommentReplyRequest req = new SuggestCommentReplyRequest("Tiêu đề", "Nội dung", "   ", "WARM");
        assertThrows(IllegalArgumentException.class, () -> service.suggestCommentReply(req));
    }

    @Test
    void suggestReplyReturnsFallbackForWarmTone() {
        SuggestCommentReplyRequest req = new SuggestCommentReplyRequest(
                "Mùa săn mây Sa Pa",
                "Review phòng view núi",
                "Phòng đẹp quá shop ơi, cuối tuần còn không ạ?",
                "WARM"
        );

        SuggestCommentReplyResponse res = service.suggestCommentReply(req);

        assertNotNull(res);
        assertTrue(res.success());
        assertEquals("WARM", res.tone());
        assertNotNull(res.suggestedReply());
        assertTrue(res.suggestedReply().contains("Lá Đỏ Homestay"));
    }

    @Test
    void suggestReplyReturnsFallbackForBookingInquiryTone() {
        SuggestCommentReplyRequest req = new SuggestCommentReplyRequest(
                "Ưu đãi mùa hè",
                "Phòng đôi Sa Pa",
                "Cho mình xin giá phòng 2 người ngày 20/10 với",
                "BOOKING_INQUIRY"
        );

        SuggestCommentReplyResponse res = service.suggestCommentReply(req);

        assertNotNull(res);
        assertTrue(res.success());
        assertEquals("BOOKING_INQUIRY", res.tone());
        assertTrue(res.suggestedReply().contains("báo giá"));
    }

    @Test
    void suggestReplyReturnsFallbackForPromoTone() {
        SuggestCommentReplyRequest req = new SuggestCommentReplyRequest(
                "Check-in Sa Pa",
                "Bài viết",
                "Đẹp quá ạ!",
                "PROMO"
        );

        SuggestCommentReplyResponse res = service.suggestCommentReply(req);

        assertNotNull(res);
        assertTrue(res.success());
        assertEquals("PROMO", res.tone());
        assertTrue(res.suggestedReply().contains("voucher"));
    }
}
