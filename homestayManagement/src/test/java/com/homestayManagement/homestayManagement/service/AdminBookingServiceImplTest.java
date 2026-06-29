package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.entity.Account;
import com.homestayManagement.homestayManagement.entity.Booking;
import com.homestayManagement.homestayManagement.entity.BookingDetail;
import com.homestayManagement.homestayManagement.entity.BookingServiceItem;
import com.homestayManagement.homestayManagement.entity.Customer;
import com.homestayManagement.homestayManagement.entity.CheckInRecord;
import com.homestayManagement.homestayManagement.entity.Employee;
import com.homestayManagement.homestayManagement.entity.FacilityService;
import com.homestayManagement.homestayManagement.entity.HousekeepingTask;
import com.homestayManagement.homestayManagement.entity.InventoryService;
import com.homestayManagement.homestayManagement.entity.Invoice;
import com.homestayManagement.homestayManagement.entity.Payment;
import com.homestayManagement.homestayManagement.entity.PricePolicy;
import com.homestayManagement.homestayManagement.entity.Role;
import com.homestayManagement.homestayManagement.entity.RoomType;
import com.homestayManagement.homestayManagement.entity.Room;
import com.homestayManagement.homestayManagement.entity.RoomPriceConfig;
import com.homestayManagement.homestayManagement.entity.ServiceUsage;
import com.homestayManagement.homestayManagement.repository.AccountRepository;
import com.homestayManagement.homestayManagement.repository.AppliedPenaltyRepository;
import com.homestayManagement.homestayManagement.repository.BookingDetailRepository;
import com.homestayManagement.homestayManagement.repository.BookingGuestRepository;
import com.homestayManagement.homestayManagement.repository.BookingRepository;
import com.homestayManagement.homestayManagement.repository.BookingServiceItemRepository;
import com.homestayManagement.homestayManagement.repository.CheckInRecordRepository;
import com.homestayManagement.homestayManagement.repository.CustomerRepository;
import com.homestayManagement.homestayManagement.repository.EmployeeRepository;
import com.homestayManagement.homestayManagement.repository.FacilityServiceRepository;
import com.homestayManagement.homestayManagement.repository.HousekeepingTaskRepository;
import com.homestayManagement.homestayManagement.repository.InventoryServiceRepository;
import com.homestayManagement.homestayManagement.repository.InvoiceRepository;
import com.homestayManagement.homestayManagement.repository.PaymentRepository;
import com.homestayManagement.homestayManagement.repository.PricePolicyRepository;
import com.homestayManagement.homestayManagement.repository.RoleRepository;
import com.homestayManagement.homestayManagement.repository.RoomAmenitiesUsageRepository;
import com.homestayManagement.homestayManagement.repository.RoomMiniBarItemRepository;
import com.homestayManagement.homestayManagement.repository.RoomPriceConfigRepository;
import com.homestayManagement.homestayManagement.repository.RoomRepository;
import com.homestayManagement.homestayManagement.repository.RulesPenaltyRepository;
import com.homestayManagement.homestayManagement.repository.ServiceUsageRepository;
import com.homestayManagement.homestayManagement.dto.request.AdminDirectBookingGuestRequest;
import com.homestayManagement.homestayManagement.dto.request.AdminDirectBookingRequest;
import com.homestayManagement.homestayManagement.dto.request.AdminDirectBookingRoomRequest;
import com.homestayManagement.homestayManagement.dto.request.AdminDirectBookingServiceRequest;
import com.homestayManagement.homestayManagement.dto.response.SePayPaymentResponse;
import com.homestayManagement.homestayManagement.service.impl.AdminBookingServiceImpl;
import com.homestayManagement.homestayManagement.service.support.BookingCodeGenerator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.times;

@ExtendWith(MockitoExtension.class)
class AdminBookingServiceImplTest {

    @Mock private BookingDetailRepository bookingDetailRepository;
    @Mock private BookingGuestRepository bookingGuestRepository;
    @Mock private BookingRepository bookingRepository;
    @Mock private BookingServiceItemRepository bookingServiceItemRepository;
    @Mock private CheckInRecordRepository checkInRecordRepository;
    @Mock private AccountRepository accountRepository;
    @Mock private CustomerRepository customerRepository;
    @Mock private RoleRepository roleRepository;
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
    @Mock private HousekeepingTaskRepository housekeepingTaskRepository;
    @Mock private EmployeeRepository employeeRepository;
    @Mock private PricePolicyRepository pricePolicyRepository;
    @Mock private RoomPriceConfigRepository roomPriceConfigRepository;
    @Mock private SePayPaymentService sePayPaymentService;
    @Mock private BookingCodeGenerator bookingCodeGenerator;

    private AdminBookingServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new AdminBookingServiceImpl(
                bookingDetailRepository,
                bookingGuestRepository,
                bookingRepository,
                roomRepository,
                accountRepository,
                customerRepository,
                roleRepository,
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
                employeeRepository,
                null,
                pricePolicyRepository,
                roomPriceConfigRepository,
                sePayPaymentService,
                housekeepingTaskRepository,
                bookingCodeGenerator
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
    void createDirectBookingSavesSelectedServicesPerRoom() {
        LocalDateTime checkIn = LocalDateTime.of(2026, 6, 30, 14, 0);
        LocalDateTime checkOut = LocalDateTime.of(2026, 7, 1, 12, 0);
        Role customerRole = Role.builder().id(1L).name("ROLE_CUSTOMER").build();
        Account account = Account.builder().id(2L).email("guest@example.com").role(customerRole).build();
        Customer customer = Customer.builder().id(3L).account(account).fullName("Guest").build();
        PricePolicy pricePolicy = PricePolicy.builder().id(4L).policyName("Daily").rentType("DAILY").build();
        RoomType roomType = RoomType.builder().id(5L).name("Studio").maxAdults(2).maxChildren(1).build();
        Room room = Room.builder().id(6L).roomNumber("101").roomType(roomType).build();
        RoomPriceConfig priceConfig = RoomPriceConfig.builder()
                .id(7L).roomType(roomType).pricePolicy(pricePolicy).dayType("WEEKDAY")
                .price(BigDecimal.valueOf(8_000)).build();
        FacilityService breakfast = FacilityService.builder()
                .id(8L).name("Breakfast").price(BigDecimal.valueOf(2_000)).isActive(true).build();
        InventoryService bike = InventoryService.builder()
                .id(9L).name("Bike").price(BigDecimal.valueOf(1_500)).quantityInStock(5).build();
        Booking booking = Booking.builder().id(10L).customer(customer).status("CONFIRMED").build();

        when(accountRepository.findByEmail("guest@example.com")).thenReturn(Optional.of(account));
        when(customerRepository.findByAccountId(2L)).thenReturn(Optional.of(customer));
        when(accountRepository.save(account)).thenReturn(account);
        when(customerRepository.save(customer)).thenReturn(customer);
        when(roomRepository.findAllById(any())).thenReturn(List.of(room));
        when(bookingDetailRepository.findOverlappingSchedule(checkIn, checkOut)).thenReturn(List.of());
        when(pricePolicyRepository.findById(4L)).thenReturn(Optional.of(pricePolicy));
        when(bookingCodeGenerator.generate(any())).thenReturn("BK_30062026_1");
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> {
            Booking saved = invocation.getArgument(0);
            saved.setId(10L);
            return saved;
        });
        when(roomPriceConfigRepository.findByRoomTypeIdAndPricePolicyIdAndDayType(5L, 4L, "WEEKDAY"))
                .thenReturn(Optional.of(priceConfig));
        when(bookingDetailRepository.save(any(BookingDetail.class))).thenAnswer(invocation -> {
            BookingDetail saved = invocation.getArgument(0);
            saved.setId(11L);
            return saved;
        });
        when(facilityServiceRepository.findById(8L)).thenReturn(Optional.of(breakfast));
        when(inventoryServiceRepository.findById(9L)).thenReturn(Optional.of(bike));
        when(bookingDetailRepository.findByIdForAdminDetail(11L)).thenReturn(Optional.of(
                BookingDetail.builder().id(11L).booking(booking).room(room).roomType(roomType)
                        .checkInTarget(checkIn).checkOutTarget(checkOut)
                        .numberOfAdults(1).numberOfChildren(0).priceAtBooking(BigDecimal.valueOf(8_000))
                        .rentType("DAILY").status("CONFIRMED").build()
        ));
        when(checkInRecordRepository.findByBookingDetailIdForAdmin(11L)).thenReturn(List.of());
        when(bookingServiceItemRepository.findByBookingDetailIds(List.of(11L))).thenReturn(List.of());
        when(serviceUsageRepository.findByBookingDetailIdForAdmin(11L)).thenReturn(List.of());
        when(roomAmenitiesUsageRepository.findByBookingDetailIdForAdmin(11L)).thenReturn(List.of());
        when(appliedPenaltyRepository.findByBookingDetailIdForAdmin(11L)).thenReturn(List.of());
        when(invoiceRepository.findByBookingIdForAdmin(10L)).thenReturn(Optional.empty());
        when(bookingGuestRepository.findByBookingDetailIds(List.of(11L))).thenReturn(List.of());
        when(facilityServiceRepository.findAll()).thenReturn(List.of());
        when(inventoryServiceRepository.findAll()).thenReturn(List.of());
        when(roomMiniBarItemRepository.findAll()).thenReturn(List.of());
        when(rulesPenaltyRepository.findAll()).thenReturn(List.of());

        AdminDirectBookingRequest request = new AdminDirectBookingRequest(
                "Guest", "0900000000", "guest@example.com", "Ha Noi", null, "0123456789",
                List.of(new AdminDirectBookingRoomRequest(
                        6L, 1, 0,
                        List.of(new AdminDirectBookingGuestRequest("Guest", "0123456789", "0900000000", null, "guest@example.com", "Ha Noi")),
                        List.of(
                                new AdminDirectBookingServiceRequest("FACILITY", 8L, 2),
                                new AdminDirectBookingServiceRequest("INVENTORY", 9L, 1)
                        )
                )),
                checkIn, checkOut, "DAILY", 4L
        );

        service.createDirectBooking(request);

        ArgumentCaptor<BookingServiceItem> itemCaptor = ArgumentCaptor.forClass(BookingServiceItem.class);
        verify(bookingServiceItemRepository, times(2)).save(itemCaptor.capture());
        assertEquals(2, itemCaptor.getAllValues().get(0).getQuantity());
        assertEquals(breakfast, itemCaptor.getAllValues().get(0).getFacilityService());
        assertEquals(1, itemCaptor.getAllValues().get(1).getQuantity());
        assertEquals(bike, itemCaptor.getAllValues().get(1).getInventoryService());
        assertEquals(4, bike.getQuantityInStock());
        verify(inventoryServiceRepository).save(bike);
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

    @Test
    void checkOutReleasesRoomForNextStay() {
        Account account = Account.builder().id(1L).email("customer@example.com").build();
        Customer customer = Customer.builder().id(2L).account(account).fullName("Customer").build();
        Booking booking = Booking.builder()
                .id(3L).customer(customer).bookingDate(LocalDateTime.now()).status("CHECKED_IN").build();
        RoomType roomType = RoomType.builder().id(4L).name("Studio").build();
        Room room = Room.builder().id(5L).roomNumber("201").roomType(roomType).status("OCCUPIED").build();
        BookingDetail detail = BookingDetail.builder()
                .id(6L).booking(booking).roomType(roomType).room(room)
                .checkInTarget(LocalDateTime.of(2026, 6, 26, 19, 0))
                .checkOutTarget(LocalDateTime.of(2026, 6, 27, 11, 0))
                .numberOfAdults(2).numberOfChildren(0)
                .priceAtBooking(BigDecimal.valueOf(700_000))
                .rentType("OVERNIGHT").status("CHECKED_IN").build();
        CheckInRecord record = CheckInRecord.builder().id(7L).bookingDetail(detail).build();
        HousekeepingTask task = HousekeepingTask.builder()
                .id(8L).checkInRecord(record).room(room).inspectionStatus("COMPLETED").build();
        InventoryService bookedRental = InventoryService.builder()
                .id(9L).name("Xe dap").price(BigDecimal.valueOf(10_000)).quantityInStock(5).build();
        BookingServiceItem bookedRentalItem = BookingServiceItem.builder()
                .id(10L).bookingDetail(detail).inventoryService(bookedRental)
                .quantity(1).priceAtBooking(BigDecimal.valueOf(10_000)).build();
        InventoryService stayRental = InventoryService.builder()
                .id(11L).name("Ao phao").price(BigDecimal.valueOf(10_000)).quantityInStock(3).build();
        ServiceUsage stayRentalUsage = ServiceUsage.builder()
                .id(12L).checkInRecord(record).inventoryService(stayRental)
                .quantity(2).priceAtUse(BigDecimal.valueOf(10_000)).build();
        Invoice invoice = Invoice.builder().id(13L).booking(booking).build();
        Payment checkoutPayment = Payment.builder()
                .id(14L).invoice(invoice).amount(BigDecimal.valueOf(30_000))
                .paymentPurpose("CHECKOUT").status("SUCCESS").build();

        when(bookingDetailRepository.findByIdForAdminDetail(6L)).thenReturn(Optional.of(detail));
        when(checkInRecordRepository.findByBookingDetailId(6L)).thenReturn(Optional.of(record));
        when(housekeepingTaskRepository.findByCheckInRecordId(7L)).thenReturn(Optional.of(task));
        when(bookingDetailRepository.findByBookingId(3L)).thenReturn(List.of(detail));
        when(bookingServiceItemRepository.findByBookingDetailIds(List.of(6L))).thenReturn(List.of(bookedRentalItem));
        when(invoiceRepository.findByBookingIdForAdmin(3L)).thenReturn(Optional.of(invoice));
        when(paymentRepository.findByInvoiceIdOrderByPaymentTimeDescIdDesc(13L)).thenReturn(List.of(checkoutPayment));
        when(checkInRecordRepository.findByBookingDetailIdForAdmin(6L)).thenReturn(List.of(record));
        when(serviceUsageRepository.findByBookingDetailIdForAdmin(6L)).thenReturn(List.of(stayRentalUsage));
        when(roomAmenitiesUsageRepository.findByBookingDetailIdForAdmin(6L)).thenReturn(List.of());
        when(appliedPenaltyRepository.findByBookingDetailIdForAdmin(6L)).thenReturn(List.of());
        when(bookingGuestRepository.findByBookingDetailIds(List.of(6L))).thenReturn(List.of());
        when(facilityServiceRepository.findAll()).thenReturn(List.of());
        when(inventoryServiceRepository.findAll()).thenReturn(List.of());
        when(roomMiniBarItemRepository.findAll()).thenReturn(List.of());
        when(rulesPenaltyRepository.findAll()).thenReturn(List.of());

        service.checkOut(6L);

        assertEquals("COMPLETED", detail.getStatus());
        assertEquals("AVAILABLE", room.getStatus());
        assertEquals(6, bookedRental.getQuantityInStock());
        assertEquals(5, stayRental.getQuantityInStock());
        verify(roomRepository).save(room);
        verify(inventoryServiceRepository).save(bookedRental);
        verify(inventoryServiceRepository).save(stayRental);
        verify(bookingDetailRepository).save(detail);
        verify(bookingRepository).save(booking);
    }

    @Test
    void prepareCheckOutChargesRemainingInvoiceBalanceAfterBookingDeposit() {
        Account account = Account.builder().id(1L).email("customer@example.com").build();
        Customer customer = Customer.builder().id(2L).account(account).fullName("Customer").build();
        Booking booking = Booking.builder()
                .id(3L).customer(customer).bookingDate(LocalDateTime.now()).status("CHECKED_IN").build();
        RoomType roomType = RoomType.builder().id(4L).name("Studio").build();
        Room room = Room.builder().id(5L).roomNumber("201").roomType(roomType).status("OCCUPIED").build();
        BookingDetail detail = BookingDetail.builder()
                .id(6L).booking(booking).roomType(roomType).room(room)
                .checkInTarget(LocalDateTime.of(2026, 6, 30, 14, 0))
                .checkOutTarget(LocalDateTime.of(2026, 7, 1, 12, 0))
                .numberOfAdults(2).numberOfChildren(0)
                .priceAtBooking(BigDecimal.valueOf(8_000))
                .rentType("DAILY").status("CHECKED_IN").build();
        CheckInRecord record = CheckInRecord.builder().id(7L).bookingDetail(detail).build();
        HousekeepingTask task = HousekeepingTask.builder()
                .id(8L).checkInRecord(record).room(room).inspectionStatus("COMPLETED").build();
        FacilityService facility = FacilityService.builder()
                .id(9L).name("Breakfast").price(BigDecimal.valueOf(4_000)).isActive(true).build();
        BookingServiceItem bookedService = BookingServiceItem.builder()
                .id(10L).bookingDetail(detail).facilityService(facility)
                .quantity(1).priceAtBooking(BigDecimal.valueOf(4_000)).build();
        Invoice invoice = Invoice.builder()
                .id(11L).booking(booking).totalAmount(BigDecimal.valueOf(12_000)).build();
        Payment bookingDeposit = Payment.builder()
                .id(12L).invoice(invoice).paymentPurpose("BOOKING")
                .amount(BigDecimal.valueOf(6_000)).status("SUCCESS").build();
        Employee employee = Employee.builder().id(13L).fullName("Receptionist").build();
        SePayPaymentResponse paymentResponse = new SePayPaymentResponse(
                3L, booking.getBookingCode(), 14L, BigDecimal.valueOf(6_000), "HMS14",
                "HMS14", "Vietcombank", "0123456789", "HOME STAY", "qr-url", null
        );

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("staff@example.com", "password")
        );
        try {
            when(bookingDetailRepository.findByIdForAdminDetail(6L)).thenReturn(Optional.of(detail));
            when(checkInRecordRepository.findByBookingDetailId(6L)).thenReturn(Optional.of(record));
            when(housekeepingTaskRepository.findByCheckInRecordId(7L)).thenReturn(Optional.of(task));
            when(checkInRecordRepository.findByBookingIdForInvoice(3L)).thenReturn(List.of(record));
            when(bookingDetailRepository.findByBookingId(3L)).thenReturn(List.of(detail));
            when(bookingServiceItemRepository.findByBookingDetailIds(List.of(6L))).thenReturn(List.of(bookedService));
            when(serviceUsageRepository.findByBookingIdForInvoice(3L)).thenReturn(List.of());
            when(roomAmenitiesUsageRepository.findByBookingIdForInvoice(3L)).thenReturn(List.of());
            when(appliedPenaltyRepository.findByBookingIdForInvoice(3L)).thenReturn(List.of());
            when(invoiceRepository.findByBookingIdForAdmin(3L)).thenReturn(Optional.of(invoice));
            when(employeeRepository.findByAccountEmail("staff@example.com")).thenReturn(Optional.of(employee));
            when(paymentRepository.findByInvoiceIdOrderByPaymentTimeDescIdDesc(11L)).thenReturn(List.of(bookingDeposit));
            when(sePayPaymentService.createCheckoutPayment(3L, BigDecimal.valueOf(6_000))).thenReturn(paymentResponse);
            when(checkInRecordRepository.findByBookingDetailIdForAdmin(6L)).thenReturn(List.of(record));
            when(serviceUsageRepository.findByBookingDetailIdForAdmin(6L)).thenReturn(List.of());
            when(roomAmenitiesUsageRepository.findByBookingDetailIdForAdmin(6L)).thenReturn(List.of());
            when(appliedPenaltyRepository.findByBookingDetailIdForAdmin(6L)).thenReturn(List.of());
            when(bookingGuestRepository.findByBookingDetailIds(List.of(6L))).thenReturn(List.of());
            when(facilityServiceRepository.findAll()).thenReturn(List.of());
            when(inventoryServiceRepository.findAll()).thenReturn(List.of());
            when(roomMiniBarItemRepository.findAll()).thenReturn(List.of());
            when(rulesPenaltyRepository.findAll()).thenReturn(List.of());

            var response = service.prepareCheckOut(6L);

            assertEquals(false, response.completed());
            assertEquals(BigDecimal.valueOf(6_000), response.payment().amount());
            verify(sePayPaymentService).createCheckoutPayment(3L, BigDecimal.valueOf(6_000));
        } finally {
            SecurityContextHolder.clearContext();
        }
    }
}
