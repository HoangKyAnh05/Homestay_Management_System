package com.homestayManagement.homestayManagement.service.support;

import com.homestayManagement.homestayManagement.entity.Booking;
import com.homestayManagement.homestayManagement.entity.BookingDetail;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class BookingInventoryPolicyTest {

    @Test
    void pendingBookingWithActivePaymentHoldBlocksInventory() {
        BookingDetail detail = detail("PENDING", "PENDING");
        detail.getBooking().setPaymentHoldExpiresAt(java.time.LocalDateTime.now().plusMinutes(5));

        assertTrue(BookingInventoryPolicy.blocksInventory(detail));
    }

    @Test
    void pendingBookingWithExpiredPaymentHoldDoesNotBlockInventory() {
        BookingDetail detail = detail("PENDING", "PENDING");
        detail.getBooking().setPaymentHoldExpiresAt(java.time.LocalDateTime.now().minusMinutes(1));

        assertFalse(BookingInventoryPolicy.blocksInventory(detail));
    }

    @Test
    void cancelledBookingOrDetailDoesNotBlockInventory() {
        BookingDetail detail1 = detail("CANCELLED", "PENDING");
        assertFalse(BookingInventoryPolicy.blocksInventory(detail1));

        BookingDetail detail2 = detail("PENDING", "CANCELLED");
        assertFalse(BookingInventoryPolicy.blocksInventory(detail2));

        BookingDetail detail3 = detail("CONFIRMED", "CANCELLED");
        assertFalse(BookingInventoryPolicy.blocksInventory(detail3));
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
