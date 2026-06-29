package com.homestayManagement.homestayManagement.service.support;

import com.homestayManagement.homestayManagement.entity.Booking;
import com.homestayManagement.homestayManagement.entity.BookingDetail;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class BookingInventoryPolicyTest {

    @Test
    void pendingBookingWithoutPaymentHoldDoesNotBlockInventory() {
        BookingDetail detail = detail("PENDING", "PENDING");

        assertFalse(BookingInventoryPolicy.blocksInventory(detail));
    }

    @Test
    void pendingBookingWithLegacyPaymentHoldDoesNotBlockInventory() {
        BookingDetail detail = detail("PENDING", "PENDING");
        detail.getBooking().setPaymentHoldExpiresAt(java.time.LocalDateTime.now().plusMinutes(15));

        assertFalse(BookingInventoryPolicy.blocksInventory(detail));
    }

    @Test
    void confirmedDetailWithPendingBookingDoesNotBlockInventory() {
        BookingDetail detail = detail("CONFIRMED", "PENDING");

        assertFalse(BookingInventoryPolicy.blocksInventory(detail));
    }

    @Test
    void confirmedBookingAlwaysBlocksInventory() {
        BookingDetail detail = detail("CONFIRMED", "CONFIRMED");

        assertTrue(BookingInventoryPolicy.blocksInventory(detail));
    }

    private BookingDetail detail(String detailStatus, String bookingStatus) {
        Booking booking = Booking.builder()
                .status(bookingStatus)
                .build();
        return BookingDetail.builder()
                .booking(booking)
                .status(detailStatus)
                .build();
    }
}
