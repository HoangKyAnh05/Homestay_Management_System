package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.request.SocialInteractionRequest;
import com.homestayManagement.homestayManagement.dto.response.MarketingNotificationResponse;
import com.homestayManagement.homestayManagement.entity.MarketingNotification;
import com.homestayManagement.homestayManagement.entity.MarketingPost;
import com.homestayManagement.homestayManagement.entity.MarketingPostChannel;
import com.homestayManagement.homestayManagement.repository.MarketingNotificationRepository;
import com.homestayManagement.homestayManagement.repository.MarketingPostChannelRepository;
import com.homestayManagement.homestayManagement.service.impl.MarketingNotificationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class MarketingNotificationServiceTest {

    private MarketingNotificationRepository notificationRepository;
    private MarketingPostChannelRepository channelRepository;
    private MarketingNotificationServiceImpl service;

    @BeforeEach
    void setUp() {
        notificationRepository = mock(MarketingNotificationRepository.class);
        channelRepository = mock(MarketingPostChannelRepository.class);
        service = new MarketingNotificationServiceImpl(notificationRepository, channelRepository);
    }

    @Test
    void recordInteraction_likeCreatesNotificationSuccessfully() {
        MarketingPost post = MarketingPost.builder().id(10L).title("Săn mây Sa Pa").build();
        MarketingPostChannel channel = MarketingPostChannel.builder()
                .id(1L)
                .platform("FACEBOOK")
                .post(post)
                .externalUrl("https://facebook.com/posts/123")
                .build();

        when(channelRepository.findById(1L)).thenReturn(Optional.of(channel));
        when(notificationRepository.save(any(MarketingNotification.class))).thenAnswer(inv -> {
            MarketingNotification n = inv.getArgument(0);
            n.setId(100L);
            return n;
        });

        SocialInteractionRequest req = new SocialInteractionRequest();
        req.setActorName("Lê Hoàng");
        req.setInteractionType("LIKE");

        MarketingNotificationResponse res = service.recordInteraction(1L, req);

        assertNotNull(res);
        assertEquals(100L, res.getId());
        assertEquals("LIKE", res.getType());
        assertEquals("Lê Hoàng", res.getActorName());
        assertTrue(res.getMessage().contains("Lê Hoàng vừa thích bài viết"));
        assertFalse(res.getIsRead());

        ArgumentCaptor<MarketingNotification> captor = ArgumentCaptor.forClass(MarketingNotification.class);
        verify(notificationRepository).save(captor.capture());
        assertEquals("FACEBOOK", captor.getValue().getPlatform());
        assertEquals(1L, captor.getValue().getChannelId());
    }

    @Test
    void countUnread_returnsRepositoryCount() {
        when(notificationRepository.countByIsReadFalse()).thenReturn(5L);
        assertEquals(5L, service.countUnread());
    }

    @Test
    void markAsRead_updatesNotificationStatus() {
        MarketingNotification notif = MarketingNotification.builder()
                .id(50L)
                .isRead(false)
                .build();
        when(notificationRepository.findById(50L)).thenReturn(Optional.of(notif));

        service.markAsRead(50L);

        assertTrue(notif.getIsRead());
        verify(notificationRepository).save(notif);
    }

    @Test
    void markAllAsRead_callsRepositoryMethod() {
        service.markAllAsRead();
        verify(notificationRepository).markAllAsRead();
    }

    @Test
    void listNotifications_returnsMappedDtoList() {
        MarketingNotification n = MarketingNotification.builder()
                .id(1L)
                .title("Thông báo")
                .message("Nội dung")
                .type("LIKE")
                .platform("FACEBOOK")
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();
        when(notificationRepository.findTop50ByOrderByCreatedAtDesc()).thenReturn(List.of(n));

        List<MarketingNotificationResponse> list = service.listNotifications(false);
        assertEquals(1, list.size());
        assertEquals("Thông báo", list.get(0).getTitle());
    }
}
