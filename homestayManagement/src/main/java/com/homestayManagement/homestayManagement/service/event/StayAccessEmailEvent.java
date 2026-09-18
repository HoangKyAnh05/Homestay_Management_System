package com.homestayManagement.homestayManagement.service.event;

import java.time.LocalDateTime;

public record StayAccessEmailEvent(
        String email,
        String representativeName,
        String roomNumber,
        String bookingCode,
        LocalDateTime checkOutTarget,
        String activationToken,
        String temporaryPassword,
        String quickLoginToken
) {
    public StayAccessEmailEvent(
            String email,
            String representativeName,
            String roomNumber,
            String bookingCode,
            LocalDateTime checkOutTarget,
            String activationToken
    ) {
        this(email, representativeName, roomNumber, bookingCode, checkOutTarget, activationToken, null, null);
    }

    public boolean activationRequired() {
        return activationToken != null && !activationToken.isBlank();
    }
}
