package com.homestayManagement.homestayManagement.service.event;

import java.time.LocalDateTime;

public record GiveawayPrizeEmailEvent(
        String email,
        String fullName,
        String phone,
        String prizeName,
        String prizeCode,
        int discountPercent,
        LocalDateTime expiryDate,
        String congratulationsMessage
) {
}
