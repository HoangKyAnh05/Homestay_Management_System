package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.request.ActivateStayAccountRequest;
import com.homestayManagement.homestayManagement.dto.request.AddBookingFacilityServiceRequest;
import com.homestayManagement.homestayManagement.entity.*;
import com.homestayManagement.homestayManagement.repository.*;
import com.homestayManagement.homestayManagement.security.JwtService;
import com.homestayManagement.homestayManagement.service.event.StayAccessEmailEvent;
import com.homestayManagement.homestayManagement.service.impl.StayAccessServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StayAccessServiceImplTest {

    @Mock private StayAccessRepository stayAccessRepository;
    @Mock private AccountActivationTokenRepository activationTokenRepository;
    @Mock private AccountRepository accountRepository;
    @Mock private CustomerRepository customerRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private FacilityServiceRepository facilityServiceRepository;
    @Mock private InventoryServiceRepository inventoryServiceRepository;
    @Mock private BookingServiceItemRepository bookingServiceItemRepository;
    @Mock private ServiceUsageRepository serviceUsageRepository;
    @Mock private InvoiceRepository invoiceRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtService jwtService;
    @Mock private ApplicationEventPublisher eventPublisher;

    private StayAccessServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new StayAccessServiceImpl(
                stayAccessRepository,
                activationTokenRepository,
                accountRepository,
                customerRepository,
                roleRepository,
                facilityServiceRepository,
                inventoryServiceRepository,
                bookingServiceItemRepository,
                serviceUsageRepository,
                invoiceRepository,
                passwordEncoder,
                jwtService,
                eventPublisher
        );
    }

    @Test
    void grantAccessReusesExistingAccountAndDoesNotCreateActivationToken() {
        StayData data = stayData();
        data.account().setActive(true);
        Customer customer = Customer.builder()
                .id(2L).account(data.account()).fullName("Khách cũ").build();

        when(stayAccessRepository.findByBookingDetailId(40L)).thenReturn(Optional.empty());
        when(accountRepository.findByEmailIgnoreCase("guest@example.com"))
                .thenReturn(Optional.of(data.account()));
        when(customerRepository.findByAccountId(1L)).thenReturn(Optional.of(customer));
        when(stayAccessRepository.save(any())).thenAnswer(invocation -> {
            StayAccess access = invocation.getArgument(0);
            access.setId(80L);
            return access;
        });

        var result = service.grantAccess(
                data.detail(), data.record(), "Khách đại diện", "Guest@Example.com"
        );

        assertEquals(80L, result.accessId());
        assertEquals(StayAccess.ACTIVE, result.status());
        assertFalse(result.activationRequired());
        verify(accountRepository, never()).save(any());
        verify(activationTokenRepository, never()).save(any());

        ArgumentCaptor<StayAccessEmailEvent> eventCaptor =
                ArgumentCaptor.forClass(StayAccessEmailEvent.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());
        assertFalse(eventCaptor.getValue().activationRequired());
        assertEquals("guest@example.com", eventCaptor.getValue().email());
    }

    @Test
    void grantAccessCreatesInactiveCustomerAndActivationLinkForNewEmail() {
        StayData data = stayData();
        when(stayAccessRepository.findByBookingDetailId(40L)).thenReturn(Optional.empty());
        when(accountRepository.findByEmailIgnoreCase("new@example.com")).thenReturn(Optional.empty());
        when(roleRepository.findByName("ROLE_CUSTOMER")).thenReturn(Optional.of(data.role()));
        when(passwordEncoder.encode(anyString())).thenReturn("hashed-random-password");
        when(accountRepository.save(any())).thenAnswer(invocation -> {
            Account account = invocation.getArgument(0);
            account.setId(91L);
            return account;
        });
        when(customerRepository.findByAccountId(91L))
                .thenReturn(Optional.of(Customer.builder().account(data.account()).fullName("Khách mới").build()));
        when(stayAccessRepository.save(any())).thenAnswer(invocation -> {
            StayAccess access = invocation.getArgument(0);
            access.setId(92L);
            return access;
        });

        var result = service.grantAccess(
                data.detail(), data.record(), "Khách mới", "new@example.com"
        );

        assertTrue(result.activationRequired());
        assertEquals(StayAccess.INVITED, result.status());
        verify(customerRepository).save(any(Customer.class));
        verify(activationTokenRepository).save(any(AccountActivationToken.class));

        ArgumentCaptor<StayAccessEmailEvent> eventCaptor =
                ArgumentCaptor.forClass(StayAccessEmailEvent.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());
        assertTrue(eventCaptor.getValue().activationRequired());
        assertFalse(eventCaptor.getValue().activationToken().isBlank());
    }

    @Test
    void activateAccountActivatesEveryInvitedRoomForThatEmail() {
        StayData data = stayData();
        data.account().setActive(false);
        AccountActivationToken token = AccountActivationToken.builder()
                .id(70L)
                .account(data.account())
                .tokenHash("hash")
                .expiresAt(LocalDateTime.now().plusHours(1))
                .build();
        StayAccess roomOne = StayAccess.builder()
                .id(80L).account(data.account()).status(StayAccess.INVITED).build();
        StayAccess roomTwo = StayAccess.builder()
                .id(81L).account(data.account()).status(StayAccess.INVITED).build();
        Customer customer = Customer.builder()
                .account(data.account()).fullName("Khách đại diện").build();

        when(activationTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(token));
        when(passwordEncoder.encode("new-password")).thenReturn("hashed-password");
        when(stayAccessRepository.findByAccountIdAndStatus(1L, StayAccess.INVITED))
                .thenReturn(List.of(roomOne, roomTwo));
        when(jwtService.generateToken(data.account())).thenReturn("jwt-token");
        when(customerRepository.findByAccountId(1L)).thenReturn(Optional.of(customer));

        var response = service.activate(new ActivateStayAccountRequest("raw-token", "new-password"));

        assertTrue(data.account().isActive());
        assertEquals("hashed-password", data.account().getPassword());
        assertNotNull(token.getUsedAt());
        assertEquals(StayAccess.ACTIVE, roomOne.getStatus());
        assertEquals(StayAccess.ACTIVE, roomTwo.getStatus());
        assertEquals("jwt-token", response.accessToken());
    }

    @Test
    void addServiceRejectsExpiredRoomAccess() {
        StayData data = stayData();
        StayAccess expired = StayAccess.builder()
                .id(80L)
                .account(data.account())
                .bookingDetail(data.detail())
                .checkInRecord(data.record())
                .status(StayAccess.EXPIRED)
                .build();
        when(stayAccessRepository.findByIdAndAccountEmail(80L, "guest@example.com"))
                .thenReturn(Optional.of(expired));

        var error = assertThrows(IllegalArgumentException.class, () -> service.addService(
                "guest@example.com",
                80L,
                new AddBookingFacilityServiceRequest(1L, "FACILITY", 1)
        ));

        assertEquals("Quyền truy cập phòng không còn hiệu lực", error.getMessage());
        verify(serviceUsageRepository, never()).save(any());
    }

    @Test
    void currentStayIncludesPreBookedAndInStayServices() {
        StayData data = stayData();
        StayAccess access = StayAccess.builder()
                .id(80L)
                .account(data.account())
                .bookingDetail(data.detail())
                .checkInRecord(data.record())
                .representativeName("Khách đại diện")
                .status(StayAccess.ACTIVE)
                .build();
        FacilityService breakfast = FacilityService.builder()
                .id(61L).name("Bữa sáng").price(BigDecimal.valueOf(80_000)).isActive(true).build();
        BookingServiceItem preBooked = BookingServiceItem.builder()
                .id(62L).bookingDetail(data.detail()).facilityService(breakfast)
                .quantity(2).priceAtBooking(BigDecimal.valueOf(80_000)).build();
        InventoryService bicycle = InventoryService.builder()
                .id(63L).name("Xe đạp").price(BigDecimal.valueOf(50_000)).build();
        ServiceUsage inStay = ServiceUsage.builder()
                .id(64L).checkInRecord(data.record()).inventoryService(bicycle)
                .quantity(1).priceAtUse(BigDecimal.valueOf(50_000)).build();

        when(stayAccessRepository.findCurrentByAccountEmail("guest@example.com"))
                .thenReturn(List.of(access));
        when(bookingServiceItemRepository.findByBookingDetailIds(List.of(40L)))
                .thenReturn(List.of(preBooked));
        when(serviceUsageRepository.findByBookingDetailIdForAdmin(40L))
                .thenReturn(List.of(inStay));

        var response = service.getCurrentStays("guest@example.com").getFirst();

        assertEquals(2, response.services().size());
        assertEquals("PRE_BOOKED", response.services().get(0).source());
        assertEquals("Bữa sáng", response.services().get(0).serviceName());
        assertEquals("STAY", response.services().get(1).source());
        assertEquals("Xe đạp", response.services().get(1).serviceName());
    }

    private StayData stayData() {
        Role role = Role.builder().id(10L).name("ROLE_CUSTOMER").build();
        Account account = Account.builder()
                .id(1L).email("guest@example.com").role(role).isActive(true).build();
        Customer bookingCustomer = Customer.builder()
                .id(2L).account(account).fullName("Người đặt").build();
        Booking booking = Booking.builder()
                .id(20L).bookingCode("BK_TEST").customer(bookingCustomer).status("CHECKED_IN").build();
        RoomType roomType = RoomType.builder().id(30L).name("Family").build();
        Room room = Room.builder()
                .id(31L).roomNumber("101").roomType(roomType).status("OCCUPIED").build();
        BookingDetail detail = BookingDetail.builder()
                .id(40L)
                .booking(booking)
                .roomType(roomType)
                .room(room)
                .checkInTarget(LocalDateTime.now().minusHours(1))
                .checkOutTarget(LocalDateTime.now().plusDays(1))
                .numberOfAdults(2)
                .numberOfChildren(0)
                .priceAtBooking(BigDecimal.valueOf(1_000_000))
                .rentType("DAILY")
                .status("CHECKED_IN")
                .build();
        CheckInRecord record = CheckInRecord.builder()
                .id(50L)
                .bookingDetail(detail)
                .customer(bookingCustomer)
                .actualCheckIn(LocalDateTime.now())
                .build();
        return new StayData(role, account, detail, record);
    }

    private record StayData(
            Role role,
            Account account,
            BookingDetail detail,
            CheckInRecord record
    ) {
    }
}
