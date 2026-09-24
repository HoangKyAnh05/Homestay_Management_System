package com.homestayManagement.homestayManagement.service.support;

import com.homestayManagement.homestayManagement.entity.Booking;
import com.homestayManagement.homestayManagement.entity.BookingDetail;

import java.time.LocalDateTime;
import java.util.Set;

public final class BookingInventoryPolicy {

    private static final Set<String> OCCUPYING_STATUSES = Set.of("CONFIRMED", "CHECKED_IN", "ACTIVE", "BOOKED");
    private static final Set<String> HOLD_STATUSES = Set.of("PENDING", "PENDING_PAYMENT", "HOLD");

    private BookingInventoryPolicy() {
    }

    public static boolean blocksInventory(BookingDetail detail) {
        if (detail == null || detail.getBooking() == null) {
            return false;
        }
        Booking booking = detail.getBooking();
        String detailStatus = normalize(detail.getStatus());
        String bookingStatus = normalize(booking.getStatus());

        if ("CANCELLED".equals(bookingStatus) || "CANCELLED".equals(detailStatus)
                || "COMPLETED".equals(bookingStatus) || "COMPLETED".equals(detailStatus)) {
            return false;
        }

        if (OCCUPYING_STATUSES.contains(bookingStatus) || OCCUPYING_STATUSES.contains(detailStatus)) {
            return true;
        }

        if (HOLD_STATUSES.contains(bookingStatus) || HOLD_STATUSES.contains(detailStatus)) {
            LocalDateTime now = LocalDateTime.now();
            if (booking.getPaymentHoldExpiresAt() != null) {
                return booking.getPaymentHoldExpiresAt().isAfter(now);
            }
            if (booking.getBookingDate() != null) {
                return booking.getBookingDate().plusMinutes(5).isAfter(now);
            }
            return true;
        }

        return false;
    }

    private static String normalize(String status) {
        return status == null ? "" : status.trim().toUpperCase();
    }
}

