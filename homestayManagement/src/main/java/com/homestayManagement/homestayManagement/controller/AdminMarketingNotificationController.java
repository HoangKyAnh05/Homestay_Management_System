package com.homestayManagement.homestayManagement.controller;

import com.homestayManagement.homestayManagement.dto.request.SocialInteractionRequest;
import com.homestayManagement.homestayManagement.dto.response.MarketingNotificationResponse;
import com.homestayManagement.homestayManagement.service.MarketingNotificationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/marketing")
public class AdminMarketingNotificationController {

    private final MarketingNotificationService notificationService;

    public AdminMarketingNotificationController(MarketingNotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping("/notifications")
    public List<MarketingNotificationResponse> listNotifications(
            @RequestParam(defaultValue = "false") boolean unreadOnly
    ) {
        return notificationService.listNotifications(unreadOnly);
    }

    @GetMapping("/notifications/unread-count")
    public Map<String, Object> getUnreadCount() {
        return Map.of("count", notificationService.countUnread());
    }

    @PatchMapping("/notifications/{id}/read")
    public Map<String, Object> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return Map.of("success", true, "id", id);
    }

    @PostMapping("/notifications/read-all")
    public Map<String, Object> markAllAsRead() {
        notificationService.markAllAsRead();
        return Map.of("success", true);
    }

    @PostMapping("/channels/{channelId}/interaction")
    public ResponseEntity<MarketingNotificationResponse> recordInteraction(
            @PathVariable Long channelId,
            @Valid @RequestBody SocialInteractionRequest request
    ) {
        MarketingNotificationResponse response = notificationService.recordInteraction(channelId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
