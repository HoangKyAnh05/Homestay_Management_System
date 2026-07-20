package com.homestayManagement.homestayManagement.service.event;

import java.time.LocalDateTime;

public record StayAccessEmailEvent(
        String email,
        String representativeName,
        String roomNumber,
        String bookingCode,
        LocalDateTime checkOutTarget,
        String activationToken
) {
    public boolean activationRequired() {
        return activationToken != null && !activationToken.isBlank();
    }
}
