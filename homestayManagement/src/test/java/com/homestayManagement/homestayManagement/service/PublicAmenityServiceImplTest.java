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
    @Mock private InventoryServiceRepository inventoryServiceRepository;
    @Mock private BookingRepository bookingRepository;
    @Mock private BookingDetailRepository bookingDetailRepository;
    @Mock private BookingServiceItemRepository bookingServiceItemRepository;
    @Mock private InvoiceRepository invoiceRepository;

    private PublicAmenityServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new PublicAmenityServiceImpl(
                facilityServiceRepository,
                inventoryServiceRepository,
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
        InventoryService rental = InventoryService.builder().id(5L).name("Xe dap").price(BigDecimal.valueOf(50_000)).quantityInStock(2).build();
        InventoryService outOfStock = InventoryService.builder().id(6L).name("Ao phao").price(BigDecimal.ONE).quantityInStock(0).build();
        when(facilityServiceRepository.findAll()).thenReturn(List.of(inactive, active));
        when(inventoryServiceRepository.findAll()).thenReturn(List.of(outOfStock, rental));

        var result = service.getActiveAmenities();

        assertEquals(2, result.size());
        assertEquals(1L, result.get(0).id());
        assertEquals("FACILITY", result.get(0).type());
        assertEquals("INVENTORY", result.get(1).type());
    }

    @Test
    void addServiceRejectsBookingOwnedByAnotherCustomer() {
        Booking booking = booking("owner@example.com");
        when(bookingRepository.findByIdForPaymentUpdate(10L)).thenReturn(Optional.of(booking));

        assertThrows(IllegalArgumentException.class, () -> service.addServiceToBooking(
                "other@example.com", 10L, new AddBookingFacilityServiceRequest(3L, "FACILITY", 1)
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
                "guest@example.com", 10L, new AddBookingFacilityServiceRequest(3L, "FACILITY", 2)
        );

        assertEquals(BigDecimal.valueOf(160_000), result.addedAmount());
        assertEquals(BigDecimal.valueOf(660_000), result.bookingTotal());
        assertEquals(BigDecimal.valueOf(160_000), invoice.getServiceCharge());
        assertEquals(BigDecimal.valueOf(660_000), invoice.getTotalAmount());
        verify(invoiceRepository).save(invoice);
    }

    @Test
    void addInventoryServiceAllowsCheckedInBookingsAndValidatesStock() {
        Booking booking = booking("guest@example.com");
        booking.setStatus("CHECKED_IN");
        BookingDetail detail = BookingDetail.builder()
                .id(20L).booking(booking).roomType(RoomType.builder().name("Garden Room").build())
                .checkInTarget(LocalDateTime.now().minusHours(2)).checkOutTarget(LocalDateTime.now().plusDays(1))
                .priceAtBooking(BigDecimal.valueOf(500_000)).status("CHECKED_IN").build();
        InventoryService rental = InventoryService.builder()
                .id(7L).name("Xe dap").price(BigDecimal.valueOf(50_000)).quantityInStock(3).build();
        AtomicReference<BookingServiceItem> savedItem = new AtomicReference<>();

        when(bookingRepository.findByIdForPaymentUpdate(10L)).thenReturn(Optional.of(booking));
        when(bookingDetailRepository.findByBookingId(10L)).thenReturn(List.of(detail));
        when(inventoryServiceRepository.findById(7L)).thenReturn(Optional.of(rental));
        when(bookingServiceItemRepository.findByBookingDetailIds(List.of(20L)))
                .thenAnswer(invocation -> savedItem.get() == null ? List.of() : List.of(savedItem.get()));
        when(bookingServiceItemRepository.save(any())).thenAnswer(invocation -> {
            BookingServiceItem item = invocation.getArgument(0);
            item.setId(31L);
            savedItem.set(item);
            return item;
        });
        when(invoiceRepository.findByBookingIdForAdmin(10L)).thenReturn(Optional.empty());

        var result = service.addServiceToBooking(
                "guest@example.com", 10L, new AddBookingFacilityServiceRequest(7L, "INVENTORY", 2)
        );

        assertEquals("Xe dap", result.serviceName());
        assertEquals(BigDecimal.valueOf(100_000), result.addedAmount());
        assertEquals(2, savedItem.get().getQuantity());
        assertEquals(7L, savedItem.get().getInventoryService().getId());
        assertEquals(1, rental.getQuantityInStock());
        verify(inventoryServiceRepository).save(rental);
    }

    private Booking booking(String email) {
        Account account = Account.builder().email(email).build();
        Customer customer = Customer.builder().account(account).build();
        return Booking.builder().id(10L).customer(customer).status("CONFIRMED").build();
    }
}
