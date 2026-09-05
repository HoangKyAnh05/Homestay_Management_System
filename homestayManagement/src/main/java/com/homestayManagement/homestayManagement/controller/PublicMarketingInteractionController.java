package com.homestayManagement.homestayManagement.controller;

import com.homestayManagement.homestayManagement.dto.request.SocialInteractionRequest;
import com.homestayManagement.homestayManagement.dto.response.MarketingNotificationResponse;
import com.homestayManagement.homestayManagement.service.MarketingNotificationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public/marketing")
public class PublicMarketingInteractionController {

    private final MarketingNotificationService notificationService;

    public PublicMarketingInteractionController(MarketingNotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @PostMapping("/channels/{channelId}/interaction")
    public ResponseEntity<MarketingNotificationResponse> recordPublicInteraction(
            @PathVariable Long channelId,
            @Valid @RequestBody SocialInteractionRequest request
    ) {
        MarketingNotificationResponse response = notificationService.recordInteraction(channelId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
