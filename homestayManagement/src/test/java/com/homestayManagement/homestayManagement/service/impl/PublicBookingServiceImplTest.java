package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.entity.*;
import com.homestayManagement.homestayManagement.repository.*;
import com.homestayManagement.homestayManagement.service.support.BookingCodeGenerator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PublicBookingServiceImplTest {

    @Mock private AccountRepository accountRepository;
    @Mock private CustomerRepository customerRepository;
    @Mock private RoomRepository roomRepository;
    @Mock private RoomTypeRepository roomTypeRepository;
    @Mock private BookingRepository bookingRepository;
    @Mock private BookingDetailRepository bookingDetailRepository;
    @Mock private BookingGuestRepository bookingGuestRepository;
    @Mock private BookingServiceItemRepository bookingServiceItemRepository;
    @Mock private ServiceUsageRepository serviceUsageRepository;
    @Mock private PricePolicyRepository pricePolicyRepository;
    @Mock private RoomPriceConfigRepository roomPriceConfigRepository;
    @Mock private FacilityServiceRepository facilityServiceRepository;
    @Mock private InventoryServiceRepository inventoryServiceRepository;

    private PublicBookingServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new PublicBookingServiceImpl(
                accountRepository,
                customerRepository,
                roomRepository,
                roomTypeRepository,
                bookingRepository,
                bookingDetailRepository,
                bookingGuestRepository,
                bookingServiceItemRepository,
                serviceUsageRepository,
                pricePolicyRepository,
                roomPriceConfigRepository,
                facilityServiceRepository,
                inventoryServiceRepository,
                new BookingCodeGenerator(bookingRepository)
        );
    }

    @Test
    void overnightPolicyAcceptsCustomerSelectedTimesInsideTheOvernightStay() {
        PricePolicy policy = PricePolicy.builder()
                .rentType("OVERNIGHT")
                .build();
        LocalDateTime checkIn = LocalDateTime.of(2026, 6, 28, 20, 0);
        LocalDateTime checkOut = LocalDateTime.of(2026, 6, 29, 10, 0);

        assertDoesNotThrow(() -> service.validatePolicyTime(policy, checkIn, checkOut));
    }

    @Test
    void hourlyPolicyStillRequiresTheConfiguredDuration() {
        PricePolicy policy = PricePolicy.builder()
                .rentType("HOURLY")
                .limitHours(2)
                .build();
        LocalDateTime checkIn = LocalDateTime.of(2026, 6, 28, 20, 0);

        assertThrows(
                IllegalArgumentException.class,
                () -> service.validatePolicyTime(policy, checkIn, checkIn.plusHours(3))
        );
    }

    @Test
    void bookingHistoryCombinesPreBookedAndInStayServices() {
        Account account = Account.builder().id(1L).email("guest@example.com").build();
        Customer customer = Customer.builder().id(2L).account(account).fullName("Khách").build();
        Booking booking = Booking.builder()
                .id(3L).bookingCode("BK_TEST").customer(customer)
                .bookingDate(LocalDateTime.now()).status("CHECKED_IN").build();
        RoomType roomType = RoomType.builder().id(4L).name("Garden").build();
        Room room = Room.builder().id(5L).roomNumber("101").roomType(roomType).build();
        BookingDetail detail = BookingDetail.builder()
                .id(6L).booking(booking).roomType(roomType).room(room)
                .checkInTarget(LocalDateTime.now().minusHours(2))
                .checkOutTarget(LocalDateTime.now().plusDays(1))
                .numberOfAdults(2).numberOfChildren(0)
                .priceAtBooking(BigDecimal.valueOf(1_000_000))
                .rentType("DAILY").status("CHECKED_IN").build();
        CheckInRecord record = CheckInRecord.builder()
                .id(7L).bookingDetail(detail).customer(customer).actualCheckIn(LocalDateTime.now()).build();
        FacilityService breakfast = FacilityService.builder()
                .id(8L).name("Bữa sáng").price(BigDecimal.valueOf(100_000)).isActive(true).build();
        BookingServiceItem preBooked = BookingServiceItem.builder()
                .id(9L).bookingDetail(detail).facilityService(breakfast)
                .quantity(1).priceAtBooking(BigDecimal.valueOf(100_000)).build();
        InventoryService bicycle = InventoryService.builder()
                .id(10L).name("Xe đạp").price(BigDecimal.valueOf(50_000)).build();
        ServiceUsage inStay = ServiceUsage.builder()
                .id(11L).checkInRecord(record).inventoryService(bicycle)
                .quantity(2).priceAtUse(BigDecimal.valueOf(50_000)).build();

        when(bookingDetailRepository.findByCustomerEmailAndBookingIdForHistory("guest@example.com", 3L))
                .thenReturn(List.of(detail));
        when(bookingServiceItemRepository.findByBookingDetailIds(List.of(6L)))
                .thenReturn(List.of(preBooked));
        when(serviceUsageRepository.findByBookingIdForInvoice(3L))
                .thenReturn(List.of(inStay));

        var response = service.getMyBookingDetail("guest@example.com", 3L);

        assertEquals(BigDecimal.valueOf(200_000), response.serviceCharge());
        assertEquals(BigDecimal.valueOf(1_200_000), response.totalAmount());
        assertEquals(2, response.services().size());
        assertEquals("PRE_BOOKED", response.services().get(0).source());
        assertEquals("STAY", response.services().get(1).source());
    }
}
