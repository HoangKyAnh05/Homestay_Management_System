package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.request.AddBookingFacilityServiceRequest;
import com.homestayManagement.homestayManagement.entity.*;
import com.homestayManagement.homestayManagement.repository.*;
import com.homestayManagement.homestayManagement.service.impl.PublicAmenityServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PublicAmenityServiceImplTest {

    @Mock private FacilityServiceRepository facilityServiceRepository;
    @Mock private BookingRepository bookingRepository;
    @Mock private BookingDetailRepository bookingDetailRepository;
    @Mock private BookingServiceItemRepository bookingServiceItemRepository;
    @Mock private InvoiceRepository invoiceRepository;

    private PublicAmenityServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new PublicAmenityServiceImpl(
                facilityServiceRepository,
                bookingRepository,
                bookingDetailRepository,
                bookingServiceItemRepository,
                invoiceRepository
        );
    }

    @Test
    void publicCatalogOnlyReturnsActiveServices() {
        FacilityService active = FacilityService.builder().id(1L).name("BBQ").price(BigDecimal.TEN).isActive(true).build();
        FacilityService inactive = FacilityService.builder().id(2L).name("Old service").price(BigDecimal.ONE).isActive(false).build();
        when(facilityServiceRepository.findAll()).thenReturn(List.of(inactive, active));

        var result = service.getActiveAmenities();

        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).id());
    }

    @Test
    void addServiceRejectsBookingOwnedByAnotherCustomer() {
        Booking booking = booking("owner@example.com");
        when(bookingRepository.findByIdForPaymentUpdate(10L)).thenReturn(Optional.of(booking));

        assertThrows(IllegalArgumentException.class, () -> service.addServiceToBooking(
                "other@example.com", 10L, new AddBookingFacilityServiceRequest(3L, 1)
        ));
        verify(bookingServiceItemRepository, never()).save(any());
    }

    @Test
    void addServiceUsesDatabasePriceAndUpdatesInvoice() {
        Booking booking = booking("guest@example.com");
        BookingDetail detail = BookingDetail.builder()
                .id(20L).booking(booking).roomType(RoomType.builder().name("Garden Room").build())
                .checkInTarget(LocalDateTime.now().plusDays(1)).checkOutTarget(LocalDateTime.now().plusDays(2))
                .priceAtBooking(BigDecimal.valueOf(500_000)).status("CONFIRMED").build();
        FacilityService facility = FacilityService.builder()
                .id(3L).name("Bữa sáng").price(BigDecimal.valueOf(80_000)).isActive(true).build();
        Invoice invoice = Invoice.builder().serviceCharge(BigDecimal.ZERO).totalAmount(BigDecimal.valueOf(500_000)).build();
        AtomicReference<BookingServiceItem> savedItem = new AtomicReference<>();

        when(bookingRepository.findByIdForPaymentUpdate(10L)).thenReturn(Optional.of(booking));
        when(bookingDetailRepository.findByBookingId(10L)).thenReturn(List.of(detail));
        when(facilityServiceRepository.findById(3L)).thenReturn(Optional.of(facility));
        when(bookingServiceItemRepository.findByBookingDetailIds(List.of(20L)))
                .thenAnswer(invocation -> savedItem.get() == null ? List.of() : List.of(savedItem.get()));
        when(bookingServiceItemRepository.save(any())).thenAnswer(invocation -> {
            BookingServiceItem item = invocation.getArgument(0);
            item.setId(30L);
            savedItem.set(item);
            return item;
        });
        when(invoiceRepository.findByBookingIdForAdmin(10L)).thenReturn(Optional.of(invoice));

        var result = service.addServiceToBooking(
                "guest@example.com", 10L, new AddBookingFacilityServiceRequest(3L, 2)
        );

        assertEquals(BigDecimal.valueOf(160_000), result.addedAmount());
        assertEquals(BigDecimal.valueOf(660_000), result.bookingTotal());
        assertEquals(BigDecimal.valueOf(160_000), invoice.getServiceCharge());
        assertEquals(BigDecimal.valueOf(660_000), invoice.getTotalAmount());
        verify(invoiceRepository).save(invoice);
    }

    private Booking booking(String email) {
        Account account = Account.builder().email(email).build();
        Customer customer = Customer.builder().account(account).build();
        return Booking.builder().id(10L).customer(customer).status("CONFIRMED").build();
    }
}
