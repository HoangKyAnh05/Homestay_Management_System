package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.entity.Account;
import com.homestayManagement.homestayManagement.entity.Booking;
import com.homestayManagement.homestayManagement.entity.BookingDetail;
import com.homestayManagement.homestayManagement.entity.BookingServiceItem;
import com.homestayManagement.homestayManagement.entity.Customer;
import com.homestayManagement.homestayManagement.entity.CheckInRecord;
import com.homestayManagement.homestayManagement.entity.FacilityService;
import com.homestayManagement.homestayManagement.entity.RoomType;
import com.homestayManagement.homestayManagement.entity.Room;
import com.homestayManagement.homestayManagement.entity.ServiceUsage;
import com.homestayManagement.homestayManagement.repository.AppliedPenaltyRepository;
import com.homestayManagement.homestayManagement.repository.BookingDetailRepository;
import com.homestayManagement.homestayManagement.repository.BookingGuestRepository;
import com.homestayManagement.homestayManagement.repository.BookingServiceItemRepository;
import com.homestayManagement.homestayManagement.repository.CheckInRecordRepository;
import com.homestayManagement.homestayManagement.repository.FacilityServiceRepository;
import com.homestayManagement.homestayManagement.repository.InventoryServiceRepository;
import com.homestayManagement.homestayManagement.repository.InvoiceRepository;
import com.homestayManagement.homestayManagement.repository.PaymentRepository;
import com.homestayManagement.homestayManagement.repository.RoomAmenitiesUsageRepository;
import com.homestayManagement.homestayManagement.repository.RoomMiniBarItemRepository;
import com.homestayManagement.homestayManagement.repository.RoomRepository;
import com.homestayManagement.homestayManagement.repository.RulesPenaltyRepository;
import com.homestayManagement.homestayManagement.repository.ServiceUsageRepository;
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
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class AdminBookingServiceImplTest {

    @Mock private BookingDetailRepository bookingDetailRepository;
    @Mock private BookingGuestRepository bookingGuestRepository;
    @Mock private BookingServiceItemRepository bookingServiceItemRepository;
    @Mock private CheckInRecordRepository checkInRecordRepository;
    @Mock private RoomRepository roomRepository;
    @Mock private ServiceUsageRepository serviceUsageRepository;
    @Mock private RoomAmenitiesUsageRepository roomAmenitiesUsageRepository;
    @Mock private AppliedPenaltyRepository appliedPenaltyRepository;
    @Mock private InvoiceRepository invoiceRepository;
    @Mock private PaymentRepository paymentRepository;
    @Mock private FacilityServiceRepository facilityServiceRepository;
    @Mock private InventoryServiceRepository inventoryServiceRepository;
    @Mock private RoomMiniBarItemRepository roomMiniBarItemRepository;
    @Mock private RulesPenaltyRepository rulesPenaltyRepository;

    private AdminBookingServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new AdminBookingServiceImpl(
                bookingDetailRepository,
                bookingGuestRepository,
                null,
                roomRepository,
                null,
                null,
                null,
                checkInRecordRepository,
                bookingServiceItemRepository,
                serviceUsageRepository,
                roomAmenitiesUsageRepository,
                appliedPenaltyRepository,
                invoiceRepository,
                paymentRepository,
                facilityServiceRepository,
                inventoryServiceRepository,
                roomMiniBarItemRepository,
                rulesPenaltyRepository,
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

    @Test
    void removeServiceRejectsChargeFromAnotherStay() {
        CheckInRecord expectedRecord = CheckInRecord.builder().id(10L).build();
        CheckInRecord otherRecord = CheckInRecord.builder().id(11L).build();
        ServiceUsage otherUsage = ServiceUsage.builder().id(20L).checkInRecord(otherRecord).build();
        when(checkInRecordRepository.findByBookingDetailId(1L)).thenReturn(Optional.of(expectedRecord));
        when(serviceUsageRepository.findById(20L)).thenReturn(Optional.of(otherUsage));

        var error = assertThrows(IllegalArgumentException.class, () -> service.removeService(1L, 20L));

        assertEquals("Khoản chi phí không thuộc ca lưu trú này", error.getMessage());
        verify(serviceUsageRepository, never()).delete(any());
    }

    @Test
    void removeServiceRejectsCompletedStay() {
        CheckInRecord completedRecord = CheckInRecord.builder()
                .id(10L)
                .actualCheckOut(LocalDateTime.now())
                .build();
        when(checkInRecordRepository.findByBookingDetailId(1L)).thenReturn(Optional.of(completedRecord));

        var error = assertThrows(IllegalArgumentException.class, () -> service.removeService(1L, 20L));

        assertEquals("Không thể xóa chi phí sau khi đã check-out", error.getMessage());
        verify(serviceUsageRepository, never()).findById(any());
    }

    @Test
    void getBookingDetailIncludesCustomerAddedBookingServices() {
        Account account = Account.builder().id(1L).email("customer@example.com").build();
        Customer customer = Customer.builder().id(2L).account(account).fullName("Khách hàng").build();
        Booking booking = Booking.builder()
                .id(3L).customer(customer).bookingDate(LocalDateTime.now()).status("CHECKED_IN").build();
        RoomType roomType = RoomType.builder().id(4L).name("Family").build();
        Room room = Room.builder().id(5L).roomNumber("101").roomType(roomType).build();
        BookingDetail detail = BookingDetail.builder()
                .id(6L).booking(booking).roomType(roomType).room(room)
                .checkInTarget(LocalDateTime.now().minusHours(1))
                .checkOutTarget(LocalDateTime.now().plusDays(1))
                .numberOfAdults(2).numberOfChildren(0)
                .priceAtBooking(BigDecimal.valueOf(1_000_000))
                .rentType("DAILY").status("CHECKED_IN").build();
        FacilityService facility = FacilityService.builder()
                .id(7L).name("Bữa sáng buffet").price(BigDecimal.valueOf(12_000)).isActive(true).build();
        BookingServiceItem bookingServiceItem = BookingServiceItem.builder()
                .id(8L).bookingDetail(detail).facilityService(facility)
                .quantity(2).priceAtBooking(BigDecimal.valueOf(12_000)).build();

        when(bookingDetailRepository.findByIdForAdminDetail(6L)).thenReturn(Optional.of(detail));
        when(checkInRecordRepository.findByBookingDetailIdForAdmin(6L)).thenReturn(List.of());
        when(bookingServiceItemRepository.findByBookingDetailIds(List.of(6L))).thenReturn(List.of(bookingServiceItem));
        when(serviceUsageRepository.findByBookingDetailIdForAdmin(6L)).thenReturn(List.of());
        when(roomAmenitiesUsageRepository.findByBookingDetailIdForAdmin(6L)).thenReturn(List.of());
        when(appliedPenaltyRepository.findByBookingDetailIdForAdmin(6L)).thenReturn(List.of());
        when(invoiceRepository.findByBookingIdForAdmin(3L)).thenReturn(Optional.empty());
        when(bookingGuestRepository.findByBookingDetailIds(List.of(6L))).thenReturn(List.of());
        when(facilityServiceRepository.findAll()).thenReturn(List.of());
        when(inventoryServiceRepository.findAll()).thenReturn(List.of());
        when(roomMiniBarItemRepository.findAll()).thenReturn(List.of());
        when(rulesPenaltyRepository.findAll()).thenReturn(List.of());

        var result = service.getBookingDetail(6L);
        var serviceItem = result.serviceItems().getFirst();

        assertEquals(1, result.serviceItems().size());
        assertEquals(-8L, serviceItem.id());
        assertEquals("FACILITY", serviceItem.type());
        assertEquals("Bữa sáng buffet", serviceItem.name());
        assertEquals(BigDecimal.valueOf(24_000), serviceItem.totalPrice());
    }
}
