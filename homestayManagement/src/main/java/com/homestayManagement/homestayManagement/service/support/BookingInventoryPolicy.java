package com.homestayManagement.homestayManagement.service.support;

import com.homestayManagement.homestayManagement.entity.Booking;
import com.homestayManagement.homestayManagement.entity.BookingDetail;

import java.util.Set;

public final class BookingInventoryPolicy {

    private static final Set<String> OCCUPYING_STATUSES = Set.of("CONFIRMED", "CHECKED_IN");

    private BookingInventoryPolicy() {
    }

    public static boolean blocksInventory(BookingDetail detail) {
        if (detail == null || detail.getBooking() == null) {
            return false;
        }
        Booking booking = detail.getBooking();
        String detailStatus = normalize(detail.getStatus());
        String bookingStatus = normalize(booking.getStatus());

        return OCCUPYING_STATUSES.contains(detailStatus)
                && OCCUPYING_STATUSES.contains(bookingStatus);
    }

    private static String normalize(String status) {
        return status == null ? "" : status.trim().toUpperCase();
    }
}
