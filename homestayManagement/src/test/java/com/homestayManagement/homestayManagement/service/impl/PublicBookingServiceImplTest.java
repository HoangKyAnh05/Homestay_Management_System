package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.request.PublicBookingRoomRequest;
import com.homestayManagement.homestayManagement.dto.request.PublicBookingServiceRequest;
import com.homestayManagement.homestayManagement.dto.request.PublicCreateBookingRequest;
import com.homestayManagement.homestayManagement.entity.*;
import com.homestayManagement.homestayManagement.repository.*;
import com.homestayManagement.homestayManagement.service.event.PublicBookingConfirmationEmailEvent;
import com.homestayManagement.homestayManagement.service.support.BookingCodeGenerator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.context.ApplicationEventPublisher;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.concurrent.atomic.AtomicLong;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
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
    @Mock private VoucherRepository voucherRepository;
    @Mock private ApplicationEventPublisher eventPublisher;
    @Mock private com.homestayManagement.homestayManagement.repository.RoomIncidentRepository roomIncidentRepository;
    @Mock private com.homestayManagement.homestayManagement.repository.InvoiceRepository invoiceRepository;
    @Mock private com.homestayManagement.homestayManagement.repository.PaymentRepository paymentRepository;

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
                voucherRepository,
                new BookingCodeGenerator(bookingRepository),
                eventPublisher,
                roomIncidentRepository,
                invoiceRepository,
                paymentRepository
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

    @Test
    void createMultiRoomBookingSavesServicesOnTheirSelectedRooms() {
        Role customerRole = Role.builder().id(1L).name("ROLE_CUSTOMER").build();
        Account account = Account.builder().id(2L).email("guest@example.com").role(customerRole).build();
        Customer customer = Customer.builder()
                .id(3L)
                .account(account)
                .fullName("Guest")
                .memberPoints(20)
                .memberDiscountPercent(BigDecimal.valueOf(2))
                .build();
        RoomType vipSuite = RoomType.builder().id(10L).name("VIP Suite").maxAdults(2).maxChildren(1).build();
        RoomType connectingRoom = RoomType.builder().id(20L).name("Connecting Room").maxAdults(4).maxChildren(3).build();
        PricePolicy dailyPolicy = PricePolicy.builder().id(30L).rentType("DAILY").build();
        FacilityService bbq = FacilityService.builder()
                .id(40L).name("BBQ").price(BigDecimal.valueOf(2_000)).isActive(true).build();
        FacilityService breakfast = FacilityService.builder()
                .id(50L).name("Breakfast").price(BigDecimal.valueOf(5_000)).isActive(true).build();
        AtomicLong detailId = new AtomicLong(100L);

        when(accountRepository.findByEmail("guest@example.com")).thenReturn(java.util.Optional.of(account));
        when(customerRepository.findByAccountId(2L)).thenReturn(java.util.Optional.of(customer));
        when(roomTypeRepository.findAllByIdForInventoryUpdate(Set.of(10L, 20L)))
                .thenReturn(List.of(vipSuite, connectingRoom));
        when(bookingDetailRepository.findOverlappingSchedule(any(), any())).thenReturn(List.of());
        when(roomRepository.findByRoomTypeId(10L)).thenReturn(List.of(Room.builder().id(11L).roomType(vipSuite).build()));
        when(roomRepository.findByRoomTypeId(20L)).thenReturn(List.of(Room.builder().id(21L).roomType(connectingRoom).build()));
        when(pricePolicyRepository.findById(30L)).thenReturn(java.util.Optional.of(dailyPolicy));
        when(roomPriceConfigRepository.findByRoomTypeIdAndDayType(org.mockito.ArgumentMatchers.eq(10L), any()))
                .thenReturn(List.of(RoomPriceConfig.builder().price(BigDecimal.valueOf(7_000)).build()));
        when(roomPriceConfigRepository.findByRoomTypeIdAndDayType(org.mockito.ArgumentMatchers.eq(20L), any()))
                .thenReturn(List.of(RoomPriceConfig.builder().price(BigDecimal.valueOf(15_000)).build()));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> {
            Booking booking = invocation.getArgument(0);
            booking.setId(60L);
            return booking;
        });
        when(bookingDetailRepository.save(any(BookingDetail.class))).thenAnswer(invocation -> {
            BookingDetail detail = invocation.getArgument(0);
            detail.setId(detailId.getAndIncrement());
            return detail;
        });
        when(facilityServiceRepository.findById(40L)).thenReturn(java.util.Optional.of(bbq));
        when(facilityServiceRepository.findById(50L)).thenReturn(java.util.Optional.of(breakfast));
        when(bookingServiceItemRepository.save(any(BookingServiceItem.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        PublicCreateBookingRequest request = new PublicCreateBookingRequest(
                "Guest",
                "0900000000",
                "guest@example.com",
                "Ha Noi",
                null,
                null,
                null,
                10L,
                List.of(
                        new PublicBookingRoomRequest(
                                null, 10L, 1, 2, 0,
                                List.of(new PublicBookingServiceRequest("FACILITY", 40L, 1))
                        ),
                        new PublicBookingRoomRequest(
                                null, 20L, 1, 2, 0,
                                List.of(new PublicBookingServiceRequest("FACILITY", 50L, 1))
                        )
                ),
                LocalDateTime.of(2026, 7, 6, 14, 0),
                LocalDateTime.of(2026, 7, 7, 12, 0),
                30L,
                2,
                0,
                null,
                List.of()
        );

        var response = service.createBooking("guest@example.com", request);

        ArgumentCaptor<BookingServiceItem> serviceItemCaptor = ArgumentCaptor.forClass(BookingServiceItem.class);
        verify(bookingServiceItemRepository, org.mockito.Mockito.times(2)).save(serviceItemCaptor.capture());
        List<BookingServiceItem> savedServices = serviceItemCaptor.getAllValues();

        assertEquals(BigDecimal.valueOf(7_000), response.serviceCharge());
        assertEquals(BigDecimal.valueOf(2), response.memberDiscountPercent());
        assertEquals(BigDecimal.valueOf(440), response.memberDiscountAmount());
        assertEquals(0, response.earnedMemberPoints());
        assertEquals(20, customer.getMemberPoints());
        assertEquals(2, response.rooms().size());
        verify(eventPublisher, never()).publishEvent(any(PublicBookingConfirmationEmailEvent.class));
        assertEquals(100L, savedServices.get(0).getBookingDetail().getId());
        assertEquals("BBQ", savedServices.get(0).getFacilityService().getName());
        assertEquals(101L, savedServices.get(1).getBookingDetail().getId());
        assertEquals("Breakfast", savedServices.get(1).getFacilityService().getName());
    }

    @Test
    void createBookingAllowsGuestCustomerWithoutAccount() {
        RoomType roomType = RoomType.builder().id(10L).name("Garden House").maxAdults(2).maxChildren(1).build();
        PricePolicy dailyPolicy = PricePolicy.builder().id(30L).rentType("DAILY").build();

        when(customerRepository.save(any(Customer.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(roomTypeRepository.findAllByIdForInventoryUpdate(Set.of(10L))).thenReturn(List.of(roomType));
        when(bookingDetailRepository.findOverlappingSchedule(any(), any())).thenReturn(List.of());
        when(roomRepository.findByRoomTypeId(10L)).thenReturn(List.of(Room.builder().id(11L).roomType(roomType).build()));
        when(pricePolicyRepository.findById(30L)).thenReturn(java.util.Optional.of(dailyPolicy));
        when(roomPriceConfigRepository.findByRoomTypeIdAndDayType(org.mockito.ArgumentMatchers.eq(10L), any()))
                .thenReturn(List.of(RoomPriceConfig.builder().price(BigDecimal.valueOf(1_200_000)).build()));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> {
            Booking booking = invocation.getArgument(0);
            booking.setId(60L);
            return booking;
        });
        when(bookingDetailRepository.save(any(BookingDetail.class))).thenAnswer(invocation -> {
            BookingDetail detail = invocation.getArgument(0);
            detail.setId(100L);
            return detail;
        });

        PublicCreateBookingRequest request = new PublicCreateBookingRequest(
                "Guest",
                "0900000000",
                "guest@example.com",
                "Ha Noi",
                null,
                "012345678901",
                null,
                10L,
                null,
                LocalDateTime.of(2026, 7, 6, 14, 0),
                LocalDateTime.of(2026, 7, 7, 12, 0),
                30L,
                2,
                0,
                null,
                List.of()
        );

        var response = service.createBooking(null, request);

        ArgumentCaptor<Customer> customerCaptor = ArgumentCaptor.forClass(Customer.class);
        verify(customerRepository).save(customerCaptor.capture());
        Customer savedCustomer = customerCaptor.getValue();

        assertEquals(null, savedCustomer.getAccount());
        assertEquals("guest@example.com", savedCustomer.getEmail());
        assertEquals(0, response.earnedMemberPoints());
        ArgumentCaptor<PublicBookingConfirmationEmailEvent> eventCaptor =
                ArgumentCaptor.forClass(PublicBookingConfirmationEmailEvent.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());
        assertEquals("guest@example.com", eventCaptor.getValue().email());
        assertEquals(response.bookingCode(), eventCaptor.getValue().bookingCode());
        assertEquals(BigDecimal.valueOf(1_200_000), eventCaptor.getValue().totalAmount());
        verify(accountRepository, never()).findByEmail(any());
    }

    @Test
    void createGuestBookingThatRequiresPaymentDoesNotSendPendingConfirmationEmail() {
        RoomType roomType = RoomType.builder().id(10L).name("Garden House").maxAdults(2).maxChildren(1).build();
        PricePolicy hourlyPolicy = PricePolicy.builder().id(31L).rentType("HOURLY").limitHours(2).build();

        when(customerRepository.save(any(Customer.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(roomTypeRepository.findAllByIdForInventoryUpdate(Set.of(10L))).thenReturn(List.of(roomType));
        when(bookingDetailRepository.findOverlappingSchedule(any(), any())).thenReturn(List.of());
        when(roomRepository.findByRoomTypeId(10L)).thenReturn(List.of(Room.builder().id(11L).roomType(roomType).build()));
        when(pricePolicyRepository.findById(31L)).thenReturn(java.util.Optional.of(hourlyPolicy));
        when(roomPriceConfigRepository.findByRoomTypeIdAndDayType(org.mockito.ArgumentMatchers.eq(10L), any()))
                .thenReturn(List.of(RoomPriceConfig.builder().price(BigDecimal.valueOf(500_000)).build()));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> {
            Booking booking = invocation.getArgument(0);
            booking.setId(61L);
            return booking;
        });
        when(bookingDetailRepository.save(any(BookingDetail.class))).thenAnswer(invocation -> {
            BookingDetail detail = invocation.getArgument(0);
            detail.setId(101L);
            return detail;
        });

        PublicCreateBookingRequest request = new PublicCreateBookingRequest(
                "Guest",
                "0900000000",
                "guest@example.com",
                "Ha Noi",
                null,
                "012345678901",
                null,
                10L,
                null,
                LocalDateTime.of(2026, 7, 6, 14, 0),
                LocalDateTime.of(2026, 7, 6, 16, 0),
                31L,
                2,
                0,
                null,
                List.of()
        );

        var response = service.createBooking(null, request);

        assertEquals("PENDING", response.status());
        assertEquals(true, response.requiresDeposit());
        assertEquals(BigDecimal.valueOf(500_000), response.depositAmount());
        verify(eventPublisher, never()).publishEvent(any(PublicBookingConfirmationEmailEvent.class));
    }

    @Test
    void createMultiRoomBookingRejectsAmbiguousBookingLevelServices() {
        Role customerRole = Role.builder().id(1L).name("ROLE_CUSTOMER").build();
        Account account = Account.builder().id(2L).email("guest@example.com").role(customerRole).build();
        Customer customer = Customer.builder().id(3L).account(account).fullName("Guest").build();
        when(accountRepository.findByEmail("guest@example.com")).thenReturn(java.util.Optional.of(account));
        when(customerRepository.findByAccountId(2L)).thenReturn(java.util.Optional.of(customer));

        PublicCreateBookingRequest request = new PublicCreateBookingRequest(
                "Guest",
                "0900000000",
                "guest@example.com",
                null,
                null,
                null,
                null,
                10L,
                List.of(
                        new PublicBookingRoomRequest(null, 10L, 1, 1, 0, List.of()),
                        new PublicBookingRoomRequest(null, 20L, 1, 1, 0, List.of())
                ),
                LocalDateTime.of(2026, 7, 6, 14, 0),
                LocalDateTime.of(2026, 7, 7, 12, 0),
                30L,
                1,
                0,
                null,
                List.of(new PublicBookingServiceRequest("FACILITY", 40L, 1))
        );

        IllegalArgumentException error = assertThrows(
                IllegalArgumentException.class,
                () -> service.createBooking("guest@example.com", request)
        );

        assertEquals("Vui lòng chọn phòng áp dụng cho từng dịch vụ", error.getMessage());
        verify(bookingRepository, never()).save(any(Booking.class));
    }
}
