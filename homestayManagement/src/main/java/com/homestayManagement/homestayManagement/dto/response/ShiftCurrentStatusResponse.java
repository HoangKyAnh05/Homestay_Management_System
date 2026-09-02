package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;

public record ShiftCurrentStatusResponse(
        boolean hasActiveShift,
        boolean isCurrentStaffInShift,
        ShiftHandoverResponse currentActiveShift,
        ShiftHandoverResponse lastHandover,
        BigDecimal initialCash,
        BigDecimal cashRevenueInShift,
        BigDecimal expectedCash,
        ReceptionistStaffResponse currentStaff
) {
}
