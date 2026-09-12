package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AdminChangeRoomRequest(
        @NotNull(message = "Vui lòng chọn phòng mới")
        Long newRoomId,

        @NotBlank(message = "Vui lòng chọn lý do đổi phòng")
        String reason,

        String notes,

        String oldRoomStatusAfterChange,

        LocalDateTime newCheckOutTarget,

        BigDecimal priceAdjustment
) {}
