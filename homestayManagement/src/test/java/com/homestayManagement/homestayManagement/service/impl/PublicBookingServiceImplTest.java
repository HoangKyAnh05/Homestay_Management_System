package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.entity.PricePolicy;
import com.homestayManagement.homestayManagement.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

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
                pricePolicyRepository,
                roomPriceConfigRepository,
                facilityServiceRepository,
                inventoryServiceRepository
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
}
