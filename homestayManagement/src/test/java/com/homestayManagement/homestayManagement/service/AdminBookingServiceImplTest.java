package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.entity.Account;
import com.homestayManagement.homestayManagement.entity.Booking;
import com.homestayManagement.homestayManagement.entity.BookingDetail;
import com.homestayManagement.homestayManagement.entity.Customer;
import com.homestayManagement.homestayManagement.entity.RoomType;
import com.homestayManagement.homestayManagement.entity.Room;
import com.homestayManagement.homestayManagement.repository.BookingDetailRepository;
import com.homestayManagement.homestayManagement.repository.CheckInRecordRepository;
import com.homestayManagement.homestayManagement.repository.RoomRepository;
import com.homestayManagement.homestayManagement.service.impl.AdminBookingServiceImpl;
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
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminBookingServiceImplTest {

    @Mock private BookingDetailRepository bookingDetailRepository;
    @Mock private CheckInRecordRepository checkInRecordRepository;
    @Mock private RoomRepository roomRepository;

    private AdminBookingServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new AdminBookingServiceImpl(
                bookingDetailRepository,
                null,
                null,
                roomRepository,
                null,
                null,
                null,
                checkInRecordRepository,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );
    }

    @Test
    void getDirectBookingRoomsIgnoresBookingDetailWithoutAssignedRoom() {
        LocalDateTime checkIn = LocalDateTime.of(2026, 6, 18, 14, 0);
        LocalDateTime checkOut = LocalDateTime.of(2026, 6, 19, 12, 0);
        Booking booking = Booking.builder().id(1L).status("CONFIRMED").build();
        RoomType roomType = RoomType.builder().id(2L).name("Family").build();
        BookingDetail unassignedDetail = BookingDetail.builder()
                .id(3L).booking(booking).roomType(roomType).room(null)
                .checkInTarget(checkIn).checkOutTarget(checkOut).status("CONFIRMED").build();
        Room room = Room.builder().id(4L).roomNumber("101").roomType(roomType).build();

        when(bookingDetailRepository.findOverlappingSchedule(checkIn, checkOut)).thenReturn(List.of(unassignedDetail));
        when(roomRepository.findAll()).thenReturn(List.of(room));

        var result = assertDoesNotThrow(() -> service.getDirectBookingRooms(checkIn, checkOut));

        assertEquals(1, result.size());
        assertEquals(true, result.getFirst().available());
    }

    @Test
    void getWeeklyScheduleSupportsWebBookingWithoutAssignedRoom() {
        LocalDate weekStart = LocalDate.of(2026, 6, 15);
        Account account = Account.builder().id(1L).email("customer@example.com").build();
        Customer customer = Customer.builder().id(2L).account(account).fullName("Khách web").build();
        Booking booking = Booking.builder()
                .id(3L).customer(customer).bookingDate(weekStart.atTime(8, 0)).status("CONFIRMED").build();
        RoomType roomType = RoomType.builder().id(4L).name("Family").build();
        BookingDetail detail = BookingDetail.builder()
                .id(5L).booking(booking).roomType(roomType).room(null)
                .checkInTarget(weekStart.plusDays(1).atTime(14, 0))
                .checkOutTarget(weekStart.plusDays(2).atTime(12, 0))
                .numberOfAdults(2).numberOfChildren(0).priceAtBooking(BigDecimal.valueOf(1_000_000))
                .rentType("DAILY").status("CONFIRMED").build();

        when(roomRepository.findAll()).thenReturn(List.of());
        when(bookingDetailRepository.findOverlappingSchedule(any(), any())).thenReturn(List.of(detail));

        var result = assertDoesNotThrow(() -> service.getWeeklySchedule(weekStart));
        var scheduleItem = result.bookings().getFirst();

        assertNull(scheduleItem.roomId());
        assertNull(scheduleItem.roomNumber());
        assertEquals("Family", scheduleItem.roomTypeName());
        assertEquals("Khách web", scheduleItem.customerName());
    }

    @Test
    void getCheckInLogsSupportsBookingDetailWithoutAssignedRoom() {
        LocalDate reportDate = LocalDate.of(2026, 6, 17);
        Account account = Account.builder().id(1L).email("customer@example.com").build();
        Customer customer = Customer.builder().id(2L).account(account).fullName("Khách hàng").build();
        Booking booking = Booking.builder()
                .id(3L).customer(customer).bookingDate(reportDate.atTime(8, 0)).status("CONFIRMED").build();
        RoomType roomType = RoomType.builder().id(4L).name("Family").build();
        BookingDetail detail = BookingDetail.builder()
                .id(5L).booking(booking).roomType(roomType).room(null)
                .checkInTarget(reportDate.atTime(14, 0)).checkOutTarget(reportDate.plusDays(1).atTime(12, 0))
                .numberOfAdults(2).numberOfChildren(1).priceAtBooking(BigDecimal.valueOf(1_200_000))
                .rentType("DAILY").status("CONFIRMED").build();
        Booking pendingBooking = Booking.builder()
                .id(6L).customer(customer).bookingDate(reportDate.atTime(9, 0)).status("PENDING").build();
        BookingDetail pendingDetail = BookingDetail.builder()
                .id(7L).booking(pendingBooking).roomType(roomType).room(null)
                .checkInTarget(reportDate.atTime(15, 0)).checkOutTarget(reportDate.plusDays(1).atTime(12, 0))
                .numberOfAdults(1).numberOfChildren(0).priceAtBooking(BigDecimal.valueOf(600_000))
                .rentType("DAILY").status("PENDING").build();

        when(bookingDetailRepository.findCheckInLogs(any(), any())).thenReturn(List.of(detail, pendingDetail));
        when(checkInRecordRepository.findByBookingDetailIdsForAdmin(List.of(5L))).thenReturn(List.of());

        var result = assertDoesNotThrow(() -> service.getCheckInLogs(reportDate, reportDate));
        var responseDetail = result.getFirst().details().getFirst();

        assertEquals(1, result.size());
        assertEquals(3L, result.getFirst().bookingId());
        assertNull(responseDetail.roomId());
        assertNull(responseDetail.roomNumber());
        assertEquals("Family", responseDetail.roomTypeName());
    }
}
