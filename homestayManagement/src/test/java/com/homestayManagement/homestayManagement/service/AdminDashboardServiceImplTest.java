package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.entity.Booking;
import com.homestayManagement.homestayManagement.entity.BookingDetail;
import com.homestayManagement.homestayManagement.entity.RoomType;
import com.homestayManagement.homestayManagement.repository.BookingDetailRepository;
import com.homestayManagement.homestayManagement.repository.InvoiceRepository;
import com.homestayManagement.homestayManagement.repository.RoomRepository;
import com.homestayManagement.homestayManagement.service.impl.AdminDashboardServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminDashboardServiceImplTest {

    @Mock
    private InvoiceRepository invoiceRepository;
    @Mock
    private BookingDetailRepository bookingDetailRepository;
    @Mock
    private RoomRepository roomRepository;

    private AdminDashboardServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new AdminDashboardServiceImpl(invoiceRepository, bookingDetailRepository, roomRepository);
    }

    @Test
    void getSummarySupportsBookingDetailWithoutAssignedRoom() {
        LocalDate reportDate = LocalDate.of(2026, 6, 17);
        RoomType roomType = RoomType.builder().id(2L).name("Phòng đôi").build();
        Booking booking = Booking.builder().id(10L).status("CONFIRMED").build();
        BookingDetail unassignedDetail = BookingDetail.builder()
                .id(20L)
                .booking(booking)
                .roomType(roomType)
                .room(null)
                .checkInTarget(reportDate.atTime(14, 0))
                .checkOutTarget(reportDate.plusDays(1).atTime(12, 0))
                .priceAtBooking(BigDecimal.valueOf(500_000))
                .status("CONFIRMED")
                .build();

        when(invoiceRepository.findByCreatedAtRangeForDashboard(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of());
        when(bookingDetailRepository.findDashboardDetails(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(unassignedDetail));
        when(roomRepository.count()).thenReturn(5L);

        var summary = assertDoesNotThrow(() -> service.getSummary(reportDate, reportDate));

        assertEquals(0, summary.occupancyTrend().getFirst().occupiedRooms());
        assertEquals(0.0, summary.kpis().averageOccupancyRate());
        assertEquals(List.of(), summary.topRooms());
        assertEquals("Phòng đôi", summary.roomTypeBreakdown().getFirst().name());
        assertEquals(1L, summary.roomTypeBreakdown().getFirst().count());
    }
}
