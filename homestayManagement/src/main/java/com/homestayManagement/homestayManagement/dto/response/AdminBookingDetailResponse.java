package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record AdminBookingDetailResponse(
        Long bookingId,
        Long bookingDetailId,
        LocalDateTime bookingDate,
        String bookingStatus,
        String detailStatus,
        Long roomId,
        String roomNumber,
        String roomTypeName,
        LocalDateTime checkInTarget,
        LocalDateTime checkOutTarget,
        Integer numberOfAdults,
        Integer numberOfChildren,
        BigDecimal priceAtBooking,
        String rentType,
        AdminBookingCustomerResponse customer,
        List<AdminBookingCheckInResponse> checkInRecords,
        List<AdminInvoiceServiceItemResponse> serviceItems,
        List<AdminInvoicePenaltyItemResponse> penaltyItems,
        AdminBookingInvoiceSummaryResponse invoice,
        List<AdminPaymentResponse> payments,
        List<FacilityServiceResponse> facilityServices,
        List<InventoryServiceResponse> inventoryServices,
        List<RoomMiniBarItemResponse> miniBarItems,
        List<RulesPenaltyResponse> penaltyRules
) {
}
