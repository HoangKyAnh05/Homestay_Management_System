package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record ScheduleMarketingChannelRequest(
        @NotNull @FutureOrPresent LocalDateTime scheduledAt
) {
}
