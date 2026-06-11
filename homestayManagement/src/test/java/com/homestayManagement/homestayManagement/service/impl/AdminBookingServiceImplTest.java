package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.response.AdminBookingScheduleResponse;
import com.homestayManagement.homestayManagement.entity.Booking;
import com.homestayManagement.homestayManagement.entity.BookingDetail;
import com.homestayManagement.homestayManagement.entity.Customer;
import com.homestayManagement.homestayManagement.entity.Room;
import com.homestayManagement.homestayManagement.entity.RoomType;
import com.homestayManagement.homestayManagement.repository.BookingDetailRepository;
import com.homestayManagement.homestayManagement.repository.RoomRepository;
import com.homestayManagement.homestayManagement.repository.AppliedPenaltyRepository;
import com.homestayManagement.homestayManagement.repository.CheckInRecordRepository;
import com.homestayManagement.homestayManagement.repository.InvoiceRepository;
import com.homestayManagement.homestayManagement.repository.PaymentRepository;
import com.homestayManagement.homestayManagement.repository.RoomAmenitiesUsageRepository;
import com.homestayManagement.homestayManagement.repository.ServiceUsageRepository;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AdminBookingServiceImplTest {

    private final BookingDetailRepository bookingDetailRepository = mock(BookingDetailRepository.class);
    private final RoomRepository roomRepository = mock(RoomRepository.class);
    private final CheckInRecordRepository checkInRecordRepository = mock(CheckInRecordRepository.class);
    private final ServiceUsageRepository serviceUsageRepository = mock(ServiceUsageRepository.class);
    private final RoomAmenitiesUsageRepository roomAmenitiesUsageRepository = mock(RoomAmenitiesUsageRepository.class);
    private final AppliedPenaltyRepository appliedPenaltyRepository = mock(AppliedPenaltyRepository.class);
    private final InvoiceRepository invoiceRepository = mock(InvoiceRepository.class);
    private final PaymentRepository paymentRepository = mock(PaymentRepository.class);
    private final AdminBookingServiceImpl service = new AdminBookingServiceImpl(
            bookingDetailRepository,
            roomRepository,
            checkInRecordRepository,
            serviceUsageRepository,
            roomAmenitiesUsageRepository,
            appliedPenaltyRepository,
            invoiceRepository,
            paymentRepository
    );

    @Test
    void getWeeklyScheduleNormalizesInputDateToMondayAndMapsBookings() {
        RoomType roomType = RoomType.builder().id(1L).name("Deluxe").basePrice(BigDecimal.valueOf(800000)).build();
        Room room = Room.builder().id(10L).roomNumber("101").roomType(roomType).build();
        Customer customer = Customer.builder().id(20L).fullName("Nguyen Van A").phone("0900000000").build();
        Booking booking = Booking.builder()
                .id(30L)
                .customer(customer)
                .bookingDate(LocalDateTime.of(2026, 6, 10, 9, 0))
                .status("CONFIRMED")
                .build();
        BookingDetail detail = BookingDetail.builder()
                .id(40L)
                .booking(booking)
                .room(room)
                .checkInTarget(LocalDateTime.of(2026, 6, 10, 14, 0))
                .checkOutTarget(LocalDateTime.of(2026, 6, 12, 12, 0))
                .numberOfAdults(2)
                .numberOfChildren(1)
                .priceAtBooking(BigDecimal.valueOf(1600000))
                .rentType("NIGHT")
                .status("CONFIRMED")
                .build();

        when(roomRepository.findAll()).thenReturn(List.of(room));
        when(bookingDetailRepository.findOverlappingSchedule(any(), any())).thenReturn(List.of(detail));

        AdminBookingScheduleResponse response = service.getWeeklySchedule(LocalDate.of(2026, 6, 10));

        assertThat(response.weekStart()).isEqualTo(LocalDate.of(2026, 6, 8));
        assertThat(response.weekStart().getDayOfWeek()).isEqualTo(DayOfWeek.MONDAY);
        assertThat(response.weekEnd()).isEqualTo(LocalDate.of(2026, 6, 14));
        assertThat(response.rooms()).hasSize(1);
        assertThat(response.bookings()).hasSize(1);
        assertThat(response.bookings().getFirst().customerName()).isEqualTo("Nguyen Van A");
        assertThat(response.bookings().getFirst().roomNumber()).isEqualTo("101");
        verify(bookingDetailRepository).findOverlappingSchedule(
                LocalDateTime.of(2026, 6, 8, 0, 0),
                LocalDateTime.of(2026, 6, 15, 0, 0)
        );
    }
}
