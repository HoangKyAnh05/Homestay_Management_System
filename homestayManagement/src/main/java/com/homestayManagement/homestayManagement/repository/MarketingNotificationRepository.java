package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.MarketingNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MarketingNotificationRepository extends JpaRepository<MarketingNotification, Long> {

    List<MarketingNotification> findTop50ByOrderByCreatedAtDesc();

    List<MarketingNotification> findTop50ByIsReadFalseOrderByCreatedAtDesc();

    List<MarketingNotification> findAllByChannelIdAndTypeOrderByCreatedAtAsc(Long channelId, String type);

    long countByIsReadFalse();

    @Modifying
    @Query("UPDATE MarketingNotification m SET m.isRead = true WHERE m.isRead = false")
    void markAllAsRead();

    @Modifying
    @Query("DELETE FROM MarketingNotification m WHERE m.actorName LIKE 'Người dùng %'")
    void deleteFakeNotifications();
}
