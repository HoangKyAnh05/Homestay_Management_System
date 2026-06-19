package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.entity.*;
import com.homestayManagement.homestayManagement.repository.*;
import com.homestayManagement.homestayManagement.service.impl.AdminHousekeepingCalendarServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminHousekeepingCalendarServiceImplTest {

    @Mock private RoomRepository roomRepository;
    @Mock private BookingDetailRepository bookingDetailRepository;
    @Mock private HousekeepingTaskRepository housekeepingTaskRepository;
    @Mock private HousekeepingTaskChecklistItemRepository taskChecklistItemRepository;
    @Mock private RoomScheduleRepository roomScheduleRepository;

    private AdminHousekeepingCalendarServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new AdminHousekeepingCalendarServiceImpl(
                roomRepository, bookingDetailRepository, housekeepingTaskRepository,
                taskChecklistItemRepository, roomScheduleRepository
        );
    }

    @Test
    void calendarShowsAssignedConfirmedBookingAndAvailableFollowingDay() {
        LocalDate start = LocalDate.of(2026, 6, 20);
        RoomType roomType = RoomType.builder().id(1L).name("Deluxe").build();
        Room room = Room.builder().id(10L).roomNumber("101").roomType(roomType).status("AVAILABLE").build();
        Customer customer = Customer.builder().id(2L).fullName("Nguyễn An").build();
        Booking booking = Booking.builder().id(3L).customer(customer).status("CONFIRMED").build();
        BookingDetail detail = BookingDetail.builder()
                .id(4L).booking(booking).roomType(roomType).room(room).status("CONFIRMED")
                .checkInTarget(LocalDateTime.of(2026, 6, 20, 14, 0))
                .checkOutTarget(LocalDateTime.of(2026, 6, 21, 11, 0))
                .build();
        when(roomRepository.findAllWithRoomType()).thenReturn(List.of(room));
        when(bookingDetailRepository.findOverlappingSchedule(any(), any())).thenReturn(List.of(detail));
        when(housekeepingTaskRepository.findAllForHousekeeping()).thenReturn(List.of());
        when(taskChecklistItemRepository.findAll()).thenReturn(List.of());
        when(roomScheduleRepository.findOverlapping(any(), any())).thenReturn(List.of());

        var result = service.getCalendar(start, 2, null);

        assertEquals("BOOKED", result.rooms().get(0).days().get(0).status());
        assertEquals("Nguyễn An", result.rooms().get(0).days().get(0).customerName());
        assertEquals("BOOKED", result.rooms().get(0).days().get(1).status());
        assertEquals(1, result.summary().booked());
    }
}
