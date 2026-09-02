package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ShiftHandoverResponse(
        Long id,
        Long outgoingStaffId,
        String outgoingStaffName,
        String outgoingStaffEmail,
        String outgoingStaffPhone,
        Long incomingStaffId,
        String incomingStaffName,
        String incomingStaffEmail,
        String incomingStaffPhone,
        LocalDateTime handoverTime,
        BigDecimal initialCash,
        BigDecimal systemCash,
        BigDecimal actualCash,
        String cashStatus,
        BigDecimal shortageAmount,
        String shortageReason,
        LocalDateTime compensationDeadline,
        String compensationStatus,
        String compensationNotes,
        LocalDateTime compensationResolvedAt,
        String status,
        String notes,
        LocalDateTime createdAt
) {
}
