package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.entity.Account;
import com.homestayManagement.homestayManagement.entity.Booking;
import com.homestayManagement.homestayManagement.entity.BookingDetail;
import com.homestayManagement.homestayManagement.entity.BookingGuest;
import com.homestayManagement.homestayManagement.entity.BookingServiceItem;
import com.homestayManagement.homestayManagement.entity.CheckInRecord;
import com.homestayManagement.homestayManagement.entity.Customer;
import com.homestayManagement.homestayManagement.entity.FacilityService;
import com.homestayManagement.homestayManagement.entity.Invoice;
import com.homestayManagement.homestayManagement.entity.Room;
import com.homestayManagement.homestayManagement.entity.RoomType;
import com.homestayManagement.homestayManagement.repository.BookingDetailRepository;
import com.homestayManagement.homestayManagement.repository.BookingGuestRepository;
import com.homestayManagement.homestayManagement.repository.BookingServiceItemRepository;
import com.homestayManagement.homestayManagement.repository.CheckInRecordRepository;
import com.homestayManagement.homestayManagement.repository.CustomerRepository;
import com.homestayManagement.homestayManagement.repository.InvoiceRepository;
import com.homestayManagement.homestayManagement.service.impl.AdminCustomerHistoryServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminCustomerHistoryServiceImplTest {

    @Mock private CustomerRepository customerRepository;
    @Mock private BookingDetailRepository bookingDetailRepository;
    @Mock private BookingGuestRepository bookingGuestRepository;
    @Mock private BookingServiceItemRepository bookingServiceItemRepository;
    @Mock private CheckInRecordRepository checkInRecordRepository;
    @Mock private InvoiceRepository invoiceRepository;

    private AdminCustomerHistoryServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new AdminCustomerHistoryServiceImpl(
                customerRepository,
                bookingDetailRepository,
                bookingGuestRepository,
                bookingServiceItemRepository,
                checkInRecordRepository,
                invoiceRepository
        );
    }

    @Test
    void getBookingHistoryReturnsRoomsServicesGuestsAndInvoiceTotal() {
        LocalDateTime checkIn = LocalDateTime.of(2026, 6, 20, 14, 0);
        Account account = Account.builder().id(10L).build();
        Customer customer = Customer.builder().id(11L).account(account).fullName("Nguyễn Văn A").build();
        Booking booking = Booking.builder().id(20L).customer(customer).bookingDate(checkIn.minusDays(3)).status("CONFIRMED").build();
        RoomType roomType = RoomType.builder().id(30L).name("Deluxe").build();
        Room room = Room.builder().id(31L).roomNumber("A101").roomType(roomType).build();
        BookingDetail detail = BookingDetail.builder()
                .id(40L).booking(booking).roomType(roomType).room(room)
                .checkInTarget(checkIn).checkOutTarget(checkIn.plusDays(2))
                .numberOfAdults(2).numberOfChildren(1).priceAtBooking(BigDecimal.valueOf(2_000_000))
                .rentType("DAILY").status("CONFIRMED").build();
        FacilityService facility = FacilityService.builder().id(50L).name("Đưa đón sân bay").build();
        BookingServiceItem serviceItem = BookingServiceItem.builder()
                .id(51L).bookingDetail(detail).facilityService(facility)
                .quantity(2).priceAtBooking(BigDecimal.valueOf(200_000)).build();
        BookingGuest guest = BookingGuest.builder()
                .id(60L).booking(booking).bookingDetail(detail).fullName("Nguyễn Văn A")
                .identityDocumentNumber("012345678901").primaryGuest(true).build();
        CheckInRecord record = CheckInRecord.builder()
                .id(70L).bookingDetail(detail).actualCheckIn(checkIn.plusMinutes(10)).build();
        Invoice invoice = Invoice.builder()
                .id(80L).booking(booking).roomCharge(BigDecimal.valueOf(2_000_000))
                .serviceCharge(BigDecimal.valueOf(400_000)).penaltyCharge(BigDecimal.ZERO)
                .totalAmount(BigDecimal.valueOf(2_400_000)).build();

        when(customerRepository.findByAccountId(10L)).thenReturn(Optional.of(customer));
        when(bookingDetailRepository.findByCustomerAccountIdForAdminHistory(10L)).thenReturn(List.of(detail));
        when(bookingGuestRepository.findByBookingDetailIds(List.of(40L))).thenReturn(List.of(guest));
        when(bookingServiceItemRepository.findByBookingDetailIds(List.of(40L))).thenReturn(List.of(serviceItem));
        when(checkInRecordRepository.findByBookingDetailIdsForAdmin(List.of(40L))).thenReturn(List.of(record));
        when(invoiceRepository.findByBookingIdsForAdmin(List.of(20L))).thenReturn(List.of(invoice));

        var response = service.getBookingHistory(10L);
        var historyBooking = response.bookings().getFirst();
        var historyRoom = historyBooking.rooms().getFirst();

        assertEquals(1, response.bookingCount());
        assertEquals(BigDecimal.valueOf(2_400_000), historyBooking.totalAmount());
        assertEquals(3, historyBooking.totalAdults() + historyBooking.totalChildren());
        assertEquals("A101", historyRoom.roomNumber());
        assertEquals(checkIn.plusMinutes(10), historyRoom.actualCheckIn());
        assertEquals("Đưa đón sân bay", historyRoom.services().getFirst().name());
        assertEquals("012345678901", historyRoom.guests().getFirst().identityDocumentNumber());
    }
}
