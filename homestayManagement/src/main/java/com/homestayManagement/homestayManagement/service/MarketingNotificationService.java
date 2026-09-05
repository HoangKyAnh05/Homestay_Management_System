package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.request.SocialInteractionRequest;
import com.homestayManagement.homestayManagement.dto.response.MarketingNotificationResponse;
import com.homestayManagement.homestayManagement.entity.MarketingNotification;

import java.util.List;

public interface MarketingNotificationService {

    MarketingNotificationResponse recordInteraction(Long channelId, SocialInteractionRequest request);

    MarketingNotification createNotification(MarketingNotification notification);

    List<MarketingNotificationResponse> listNotifications(boolean unreadOnly);

    long countUnread();

    void markAsRead(Long id);

    void markAllAsRead();
}
