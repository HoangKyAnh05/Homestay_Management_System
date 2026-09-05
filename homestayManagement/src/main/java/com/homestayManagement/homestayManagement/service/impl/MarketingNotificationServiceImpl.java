package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.request.SocialInteractionRequest;
import com.homestayManagement.homestayManagement.dto.response.MarketingNotificationResponse;
import com.homestayManagement.homestayManagement.entity.MarketingNotification;
import com.homestayManagement.homestayManagement.entity.MarketingPostChannel;
import com.homestayManagement.homestayManagement.repository.MarketingNotificationRepository;
import com.homestayManagement.homestayManagement.repository.MarketingPostChannelRepository;
import com.homestayManagement.homestayManagement.service.MarketingNotificationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class MarketingNotificationServiceImpl implements MarketingNotificationService {

    private final MarketingNotificationRepository notificationRepository;
    private final MarketingPostChannelRepository channelRepository;

    public MarketingNotificationServiceImpl(
            MarketingNotificationRepository notificationRepository,
            MarketingPostChannelRepository channelRepository
    ) {
        this.notificationRepository = notificationRepository;
        this.channelRepository = channelRepository;
    }

    @Override
    @Transactional
    public MarketingNotificationResponse recordInteraction(Long channelId, SocialInteractionRequest request) {
        MarketingPostChannel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy kênh bài viết ID: " + channelId));

        String actor = hasText(request.getActorName()) ? request.getActorName().trim() : "Một người dùng";
        String type = hasText(request.getInteractionType()) ? request.getInteractionType().trim().toUpperCase() : "LIKE";
        String postTitle = channel.getPost() != null && hasText(channel.getPost().getTitle())
                ? channel.getPost().getTitle()
                : "Bài viết Sa Pa";
        String platform = channel.getPlatform() != null ? channel.getPlatform().toUpperCase() : "MẠNG XÃ HỘI";

        String title;
        String message;

        if ("LIKE".equals(type)) {
            title = "❤️ Lượt thích mới trên " + platform;
            message = actor + " vừa thích bài viết '" + postTitle + "' trên " + platform + "!";
        } else if ("COMMENT".equals(type)) {
            title = "💬 Bình luận mới trên " + platform;
            String commentPreview = hasText(request.getCommentText()) ? request.getCommentText().trim() : "";
            if (commentPreview.length() > 80) {
                commentPreview = commentPreview.substring(0, 77) + "...";
            }
            message = actor + " đã bình luận: \"" + commentPreview + "\" trên bài viết '" + postTitle + "'!";
        } else if ("SHARE".equals(type)) {
            title = "🔄 Lượt chia sẻ mới trên " + platform;
            message = actor + " vừa chia sẻ bài viết '" + postTitle + "' trên " + platform + "!";
        } else {
            title = "⚡ Tương tác mới trên " + platform;
            message = actor + " vừa tương tác với bài viết '" + postTitle + "'.";
        }

        MarketingNotification notification = MarketingNotification.builder()
                .title(title)
                .message(message)
                .type(type)
                .platform(platform)
                .channelId(channel.getId())
                .postTitle(postTitle)
                .actorName(actor)
                .externalUrl(channel.getExternalUrl())
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();

        MarketingNotification saved = notificationRepository.save(notification);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public MarketingNotification createNotification(MarketingNotification notification) {
        if (notification.getCreatedAt() == null) {
            notification.setCreatedAt(LocalDateTime.now());
        }
        if (notification.getIsRead() == null) {
            notification.setIsRead(false);
        }
        return notificationRepository.save(notification);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MarketingNotificationResponse> listNotifications(boolean unreadOnly) {
        List<MarketingNotification> list = unreadOnly
                ? notificationRepository.findTop50ByIsReadFalseOrderByCreatedAtDesc()
                : notificationRepository.findTop50ByOrderByCreatedAtDesc();

        return list.stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public long countUnread() {
        return notificationRepository.countByIsReadFalse();
    }

    @Override
    @Transactional
    public void markAsRead(Long id) {
        notificationRepository.findById(id).ifPresent(n -> {
            n.setIsRead(true);
            notificationRepository.save(n);
        });
    }

    @Override
    @Transactional
    public void markAllAsRead() {
        notificationRepository.markAllAsRead();
    }

    private MarketingNotificationResponse toResponse(MarketingNotification n) {
        MarketingNotificationResponse resp = new MarketingNotificationResponse();
        resp.setId(n.getId());
        resp.setTitle(n.getTitle());
        resp.setMessage(n.getMessage());
        resp.setType(n.getType());
        resp.setPlatform(n.getPlatform());
        resp.setChannelId(n.getChannelId());
        resp.setPostTitle(n.getPostTitle());
        resp.setActorName(n.getActorName());
        resp.setExternalUrl(n.getExternalUrl());
        resp.setIsRead(n.getIsRead());
        resp.setCreatedAt(n.getCreatedAt());
        return resp;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
