package com.homestayManagement.homestayManagement.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.homestayManagement.homestayManagement.entity.Booking;
import com.homestayManagement.homestayManagement.entity.BookingDetail;
import com.homestayManagement.homestayManagement.entity.BookingServiceItem;
import com.homestayManagement.homestayManagement.entity.Customer;
import com.homestayManagement.homestayManagement.entity.Invoice;
import com.homestayManagement.homestayManagement.entity.InventoryService;
import com.homestayManagement.homestayManagement.entity.Payment;
import com.homestayManagement.homestayManagement.entity.ServiceUsage;
import com.homestayManagement.homestayManagement.repository.BookingDetailRepository;
import com.homestayManagement.homestayManagement.repository.BookingRepository;
import com.homestayManagement.homestayManagement.repository.BookingServiceItemRepository;
import com.homestayManagement.homestayManagement.repository.InventoryServiceRepository;
import com.homestayManagement.homestayManagement.repository.InvoiceRepository;
import com.homestayManagement.homestayManagement.repository.PaymentRepository;
import com.homestayManagement.homestayManagement.repository.RoomRepository;
import com.homestayManagement.homestayManagement.repository.RoomTypeRepository;
import com.homestayManagement.homestayManagement.repository.ServiceUsageRepository;
import com.homestayManagement.homestayManagement.service.impl.SePayPaymentServiceImpl;
import com.homestayManagement.homestayManagement.service.event.PublicBookingConfirmationEmailEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SePayPaymentServiceImplTest {

    private static final String SECRET = "test-secret";

    @Mock
    private BookingRepository bookingRepository;
    @Mock
    private BookingDetailRepository bookingDetailRepository;
    @Mock
    private RoomRepository roomRepository;
    @Mock
    private RoomTypeRepository roomTypeRepository;
    @Mock
    private BookingServiceItemRepository bookingServiceItemRepository;
    @Mock
    private com.homestayManagement.homestayManagement.repository.CheckInRecordRepository checkInRecordRepository;
    @Mock
    private InvoiceRepository invoiceRepository;
    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private ServiceUsageRepository serviceUsageRepository;
    @Mock
    private InventoryServiceRepository inventoryServiceRepository;
    @Mock
    private StayAccessService stayAccessService;
    @Mock
    private ApplicationEventPublisher eventPublisher;

    private SePayPaymentServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new SePayPaymentServiceImpl(
                bookingRepository,
                bookingDetailRepository,
                roomRepository,
                roomTypeRepository,
                bookingServiceItemRepository,
                checkInRecordRepository,
                invoiceRepository,
                paymentRepository,
                serviceUsageRepository,
                inventoryServiceRepository,
                stayAccessService,
                new ObjectMapper(),
                eventPublisher,
                "Vietcombank",
                "0123456789",
                "NGUYEN VAN A",
                "HMS",
                "",
                SECRET
        );
    }

    @Test
    void handleWebhookConfirmsBookingAndPayment() throws Exception {
        Booking booking = Booking.builder().id(10L).status("PENDING").build();
        Invoice invoice = Invoice.builder().id(20L).booking(booking).build();
        Payment payment = Payment.builder()
                .id(30L)
                .invoice(invoice)
                .paymentCode("HMS30")
                .amount(BigDecimal.valueOf(250_000))
                .status("PENDING")
                .build();
        BookingDetail detail = BookingDetail.builder().id(40L).booking(booking).status("PENDING").build();
        byte[] body = webhookBody(92704L, 250_000);
        String timestamp = String.valueOf(Instant.now().getEpochSecond());

        when(paymentRepository.findBySepayTransactionId(92704L)).thenReturn(Optional.empty());
        when(paymentRepository.findByPaymentCodeIgnoreCase("HMS30")).thenReturn(Optional.of(payment));
        when(bookingRepository.findByIdForPaymentUpdate(10L)).thenReturn(Optional.of(booking));
        when(bookingDetailRepository.findByBookingId(10L)).thenReturn(List.of(detail));

        service.handleWebhook(body, signature(body, timestamp), timestamp);

        assertEquals("SUCCESS", payment.getStatus());
        assertEquals(92704L, payment.getSepayTransactionId());
        assertEquals("CONFIRMED", booking.getStatus());
        assertEquals("CONFIRMED", detail.getStatus());
        verify(paymentRepository).save(payment);
        verify(bookingRepository).save(booking);
        verify(bookingDetailRepository).saveAll(List.of(detail));
    }

    @Test
    void handleWebhookRejectsInvalidSignature() {
        byte[] body = "{}".getBytes(StandardCharsets.UTF_8);
        String timestamp = String.valueOf(Instant.now().getEpochSecond());

        assertThrows(
                IllegalArgumentException.class,
                () -> service.handleWebhook(body, "sha256=invalid", timestamp)
        );
        verify(paymentRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void handleWebhookRejectsUnderpayment() throws Exception {
        Booking booking = Booking.builder().id(10L).status("PENDING").build();
        Invoice invoice = Invoice.builder().id(20L).booking(booking).build();
        Payment payment = Payment.builder()
                .invoice(invoice)
                .paymentCode("HMS30")
                .amount(BigDecimal.valueOf(250_000))
                .status("PENDING")
                .build();
        byte[] body = webhookBody(92705L, 100_000);
        String timestamp = String.valueOf(Instant.now().getEpochSecond());

        when(paymentRepository.findBySepayTransactionId(92705L)).thenReturn(Optional.empty());
        when(paymentRepository.findByPaymentCodeIgnoreCase("HMS30")).thenReturn(Optional.of(payment));

        assertThrows(
                IllegalArgumentException.class,
                () -> service.handleWebhook(body, signature(body, timestamp), timestamp)
        );
        verify(bookingRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void createBookingPaymentForAdminSupportsWalkInCustomer() {
        Booking booking = Booking.builder().id(10L).status("PENDING").build();
        BookingDetail detail = BookingDetail.builder()
                .booking(booking)
                .rentType("HOURLY")
                .priceAtBooking(BigDecimal.valueOf(300_000))
                .build();
        Invoice invoice = Invoice.builder()
                .id(20L)
                .booking(booking)
                .totalAmount(BigDecimal.valueOf(300_000))
                .build();
        Payment payment = Payment.builder()
                .id(30L)
                .invoice(invoice)
                .paymentCode("HMS30")
                .paymentPurpose("BOOKING")
                .amount(BigDecimal.valueOf(300_000))
                .status("PENDING")
                .build();

        when(bookingRepository.findByIdForPaymentUpdate(10L)).thenReturn(Optional.of(booking));
        when(bookingDetailRepository.findByBookingId(10L)).thenReturn(List.of(detail));
        when(invoiceRepository.findByBookingIdForAdmin(10L)).thenReturn(Optional.of(invoice));
        when(paymentRepository.findFirstByInvoiceIdAndPaymentMethodAndPaymentPurposeAndStatusOrderByIdDesc(
                20L, "SEPAY", "BOOKING", "PENDING"
        )).thenReturn(Optional.of(payment));
        when(paymentRepository.save(payment)).thenReturn(payment);

        var response = service.createBookingPaymentForAdmin(10L);

        assertEquals(10L, response.bookingId());
        assertEquals(BigDecimal.valueOf(300_000), response.amount());
        assertEquals("HMS30", response.transferContent());
        assertNull(booking.getPaymentHoldExpiresAt());
        assertNull(response.holdExpiresAt());
    }

    @Test
    void createPublicBookingPaymentAllowsGuestWithMatchingEmail() {
        Customer customer = Customer.builder().id(1L).email("guest@example.com").fullName("Guest").build();
        Booking booking = Booking.builder().id(10L).bookingCode("BK_TEST").customer(customer).status("PENDING").build();
        BookingDetail detail = BookingDetail.builder()
                .booking(booking)
                .rentType("HOURLY")
                .priceAtBooking(BigDecimal.valueOf(300_000))
                .build();
        Invoice invoice = Invoice.builder()
                .id(20L)
                .booking(booking)
                .totalAmount(BigDecimal.valueOf(300_000))
                .build();
        Payment payment = Payment.builder()
                .id(30L)
                .invoice(invoice)
                .paymentCode("HMS30")
                .paymentPurpose("BOOKING")
                .amount(BigDecimal.valueOf(300_000))
                .status("PENDING")
                .build();

        when(bookingRepository.findByIdForPaymentUpdate(10L)).thenReturn(Optional.of(booking));
        when(bookingDetailRepository.findByBookingId(10L)).thenReturn(List.of(detail));
        when(invoiceRepository.findByBookingIdForAdmin(10L)).thenReturn(Optional.of(invoice));
        when(paymentRepository.findFirstByInvoiceIdAndPaymentMethodAndPaymentPurposeAndStatusOrderByIdDesc(
                20L, "SEPAY", "BOOKING", "PENDING"
        )).thenReturn(Optional.of(payment));
        when(paymentRepository.save(payment)).thenReturn(payment);

        var response = service.createPublicBookingPayment(10L, "guest@example.com");

        assertEquals(10L, response.bookingId());
        assertEquals(BigDecimal.valueOf(300_000), response.amount());
    }

    @Test
    void createPublicBookingPaymentRejectsWrongGuestEmail() {
        Customer customer = Customer.builder().id(1L).email("guest@example.com").fullName("Guest").build();
        Booking booking = Booking.builder().id(10L).customer(customer).status("PENDING").build();

        when(bookingRepository.findByIdForPaymentUpdate(10L)).thenReturn(Optional.of(booking));

        assertThrows(
                IllegalArgumentException.class,
                () -> service.createPublicBookingPayment(10L, "other@example.com")
        );
        verify(paymentRepository, never()).save(any());
    }

    @Test
    void createCheckoutPaymentReplacesStalePendingPaymentWhenAmountChanges() {
        Booking booking = Booking.builder().id(10L).status("CHECKED_IN").build();
        BookingDetail detail = BookingDetail.builder().id(40L).booking(booking).status("CHECKED_IN").build();
        Invoice invoice = Invoice.builder().id(20L).booking(booking).build();
        Payment stalePayment = Payment.builder()
                .id(30L)
                .invoice(invoice)
                .paymentCode("HMS30")
                .paymentPurpose("CHECKOUT")
                .paymentMethod("SEPAY")
                .amount(BigDecimal.valueOf(3_000))
                .status("PENDING")
                .build();

        when(bookingRepository.findByIdForPaymentUpdate(10L)).thenReturn(Optional.of(booking));
        when(bookingDetailRepository.findById(40L)).thenReturn(Optional.of(detail));
        when(invoiceRepository.findByBookingIdForAdmin(10L)).thenReturn(Optional.of(invoice));
        when(paymentRepository.findFirstByInvoiceIdAndBookingDetailIdAndPaymentMethodAndPaymentPurposeAndStatusOrderByIdDesc(
                20L, 40L, "SEPAY", "CHECKOUT", "PENDING"
        )).thenReturn(Optional.of(stalePayment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> {
            Payment payment = invocation.getArgument(0);
            if (payment.getId() == null) {
                payment.setId(31L);
            }
            return payment;
        });

        var response = service.createCheckoutPayment(10L, 40L, BigDecimal.valueOf(4_750));

        assertEquals("FAILED", stalePayment.getStatus());
        assertEquals(31L, response.paymentId());
        assertEquals(BigDecimal.valueOf(4_750), response.amount());
        assertEquals("HMS31", response.paymentCode());
        assertEquals("HMS31", response.transferContent());
    }

    @Test
    void handleCheckoutWebhookCompletesStay() throws Exception {
        Booking booking = Booking.builder().id(10L).status("CHECKED_IN").build();
        Invoice invoice = Invoice.builder().id(20L).booking(booking).build();
        Payment payment = Payment.builder()
                .id(31L)
                .invoice(invoice)
                .paymentCode("HMS31")
                .paymentPurpose("CHECKOUT")
                .amount(BigDecimal.valueOf(150_000))
                .status("PENDING")
                .build();
        BookingDetail detail = BookingDetail.builder().id(40L).booking(booking).status("CHECKED_IN").build();
        com.homestayManagement.homestayManagement.entity.CheckInRecord record =
                com.homestayManagement.homestayManagement.entity.CheckInRecord.builder()
                        .id(50L)
                        .bookingDetail(detail)
                        .build();
        InventoryService bookedRental = InventoryService.builder()
                .id(60L).name("Xe dap").price(BigDecimal.valueOf(10_000)).quantityInStock(9).build();
        BookingServiceItem bookedRentalItem = BookingServiceItem.builder()
                .id(61L).bookingDetail(detail).inventoryService(bookedRental)
                .quantity(1).priceAtBooking(BigDecimal.valueOf(10_000)).build();
        InventoryService stayRental = InventoryService.builder()
                .id(62L).name("Ao phao").price(BigDecimal.valueOf(10_000)).quantityInStock(3).build();
        ServiceUsage stayRentalUsage = ServiceUsage.builder()
                .id(63L).checkInRecord(record).inventoryService(stayRental)
                .quantity(2).priceAtUse(BigDecimal.valueOf(10_000)).build();
        byte[] body = webhookBody(92706L, 150_000, "HMS31");
        String timestamp = String.valueOf(Instant.now().getEpochSecond());

        when(paymentRepository.findBySepayTransactionId(92706L)).thenReturn(Optional.empty());
        when(paymentRepository.findByPaymentCodeIgnoreCase("HMS31")).thenReturn(Optional.of(payment));
        when(bookingRepository.findByIdForPaymentUpdate(10L)).thenReturn(Optional.of(booking));
        when(checkInRecordRepository.findByBookingIdForInvoice(10L)).thenReturn(List.of(record));
        when(bookingDetailRepository.findByBookingId(10L)).thenReturn(List.of(detail));
        when(bookingServiceItemRepository.findByBookingDetailIds(List.of(40L))).thenReturn(List.of(bookedRentalItem));
        when(serviceUsageRepository.findByBookingDetailIdForAdmin(40L)).thenReturn(List.of(stayRentalUsage));

        service.handleWebhook(body, signature(body, timestamp), timestamp);

        assertEquals("SUCCESS", payment.getStatus());
        assertEquals("COMPLETED", booking.getStatus());
        assertEquals("COMPLETED", detail.getStatus());
        assertEquals(10, bookedRental.getQuantityInStock());
        assertEquals(5, stayRental.getQuantityInStock());
        org.junit.jupiter.api.Assertions.assertNotNull(record.getActualCheckOut());
        verify(checkInRecordRepository).saveAll(List.of(record));
        verify(inventoryServiceRepository).save(bookedRental);
        verify(inventoryServiceRepository).save(stayRental);
    }

    @Test
    void handleCheckoutWebhookCompletesOnlyThePaidRoom() throws Exception {
        Booking booking = Booking.builder().id(10L).status("CHECKED_IN").build();
        var room102 = com.homestayManagement.homestayManagement.entity.Room.builder()
                .id(11L).roomNumber("102").status("OCCUPIED").build();
        var room201 = com.homestayManagement.homestayManagement.entity.Room.builder()
                .id(12L).roomNumber("201").status("OCCUPIED").build();
        BookingDetail detail102 = BookingDetail.builder()
                .id(40L).booking(booking).room(room102).status("CHECKED_IN").build();
        BookingDetail detail201 = BookingDetail.builder()
                .id(41L).booking(booking).room(room201).status("CHECKED_IN").build();
        Invoice invoice = Invoice.builder().id(20L).booking(booking).build();
        Payment payment = Payment.builder()
                .id(31L).invoice(invoice).bookingDetail(detail102)
                .paymentCode("HMS31").paymentPurpose("CHECKOUT")
                .amount(BigDecimal.valueOf(2_000)).status("PENDING").build();
        var record102 = com.homestayManagement.homestayManagement.entity.CheckInRecord.builder()
                .id(50L).bookingDetail(detail102).build();
        byte[] body = webhookBody(92707L, 2_000, "HMS31");
        String timestamp = String.valueOf(Instant.now().getEpochSecond());

        when(paymentRepository.findBySepayTransactionId(92707L)).thenReturn(Optional.empty());
        when(paymentRepository.findByPaymentCodeIgnoreCase("HMS31")).thenReturn(Optional.of(payment));
        when(bookingRepository.findByIdForPaymentUpdate(10L)).thenReturn(Optional.of(booking));
        when(checkInRecordRepository.findByBookingDetailId(40L)).thenReturn(Optional.of(record102));
        when(bookingDetailRepository.findByBookingId(10L)).thenReturn(List.of(detail102, detail201));
        when(bookingServiceItemRepository.findByBookingDetailIds(List.of(40L))).thenReturn(List.of());
        when(serviceUsageRepository.findByBookingDetailIdForAdmin(40L)).thenReturn(List.of());

        service.handleWebhook(body, signature(body, timestamp), timestamp);

        assertEquals("SUCCESS", payment.getStatus());
        assertEquals("COMPLETED", detail102.getStatus());
        assertEquals("CHECKED_IN", detail201.getStatus());
        assertEquals("AVAILABLE", room102.getStatus());
        assertEquals("OCCUPIED", room201.getStatus());
        assertEquals("CHECKED_IN", booking.getStatus());
        assertNotNull(record102.getActualCheckOut());
        verify(bookingDetailRepository).save(detail102);
        verify(roomRepository).save(room102);
        verify(stayAccessService).expireAccess(40L);
        verify(bookingDetailRepository, never()).save(detail201);
    }

    @Test
    void bookingWebhookPublishesPaidEmailForGuestBooking() throws Exception {
        Customer customer = Customer.builder().id(1L).email("guest@example.com").fullName("Guest").build();
        Booking booking = Booking.builder().id(10L).bookingCode("BK_TEST").customer(customer).status("PENDING").build();
        Invoice invoice = Invoice.builder()
                .id(20L)
                .booking(booking)
                .roomCharge(BigDecimal.valueOf(250_000))
                .serviceCharge(BigDecimal.ZERO)
                .totalAmount(BigDecimal.valueOf(250_000))
                .build();
        Payment payment = Payment.builder()
                .id(30L)
                .invoice(invoice)
                .paymentCode("HMS30")
                .paymentPurpose("BOOKING")
                .amount(BigDecimal.valueOf(250_000))
                .status("PENDING")
                .build();
        BookingDetail detail = BookingDetail.builder()
                .id(40L)
                .booking(booking)
                .status("PENDING")
                .priceAtBooking(BigDecimal.valueOf(250_000))
                .allocatedDiscount(BigDecimal.ZERO)
                .build();
        byte[] body = webhookBody(92708L, 250_000);
        String timestamp = String.valueOf(Instant.now().getEpochSecond());

        when(paymentRepository.findBySepayTransactionId(92708L)).thenReturn(Optional.empty());
        when(paymentRepository.findByPaymentCodeIgnoreCase("HMS30")).thenReturn(Optional.of(payment));
        when(bookingRepository.findByIdForPaymentUpdate(10L)).thenReturn(Optional.of(booking));
        when(bookingDetailRepository.findByBookingId(10L)).thenReturn(List.of(detail));

        service.handleWebhook(body, signature(body, timestamp), timestamp);

        ArgumentCaptor<PublicBookingConfirmationEmailEvent> eventCaptor =
                ArgumentCaptor.forClass(PublicBookingConfirmationEmailEvent.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());
        assertEquals("guest@example.com", eventCaptor.getValue().email());
        assertEquals(true, eventCaptor.getValue().paymentConfirmed());
    }

    @Test
    void handleWebhookWithApiKeyAuthentication() {
        Booking booking = Booking.builder().id(10L).status("PENDING").build();
        Invoice invoice = Invoice.builder().id(20L).booking(booking).build();
        Payment payment = Payment.builder()
                .id(30L)
                .invoice(invoice)
                .paymentCode("HMS30")
                .amount(BigDecimal.valueOf(250_000))
                .status("PENDING")
                .build();
        BookingDetail detail = BookingDetail.builder().id(40L).booking(booking).status("PENDING").build();
        byte[] body = webhookBody(92706L, 250_000);

        when(paymentRepository.findBySepayTransactionId(92706L)).thenReturn(Optional.empty());
        when(paymentRepository.findByPaymentCodeIgnoreCase("HMS30")).thenReturn(Optional.of(payment));
        when(bookingRepository.findByIdForPaymentUpdate(10L)).thenReturn(Optional.of(booking));
        when(bookingDetailRepository.findByBookingId(10L)).thenReturn(List.of(detail));

        service.handleWebhook(body, "", "", "Apikey " + SECRET);

        assertEquals("SUCCESS", payment.getStatus());
        assertEquals(92706L, payment.getSepayTransactionId());
        assertEquals("CONFIRMED", booking.getStatus());
        verify(paymentRepository).save(payment);
    }

    @Test
    void handleWebhookExtractsPaymentCodeFromContentWhenCodeIsNull() {
        Booking booking = Booking.builder().id(10L).status("PENDING").build();
        Invoice invoice = Invoice.builder().id(20L).booking(booking).build();
        Payment payment = Payment.builder()
                .id(30L)
                .invoice(invoice)
                .paymentCode("HMS30")
                .amount(BigDecimal.valueOf(250_000))
                .status("PENDING")
                .build();
        BookingDetail detail = BookingDetail.builder().id(40L).booking(booking).status("PENDING").build();
        String json = """
                {
                  "id": 92707,
                  "gateway": "TPBank",
                  "transactionDate": "2026-06-14 13:00:00",
                  "accountNumber": "0123456789",
                  "code": null,
                  "content": "MBVCB.123456.HMS30 chuyen tien",
                  "transferType": "in",
                  "description": "Nguyen Van A HMS30",
                  "transferAmount": 250000,
                  "referenceCode": "FT2600002"
                }
                """;
        byte[] body = json.getBytes(StandardCharsets.UTF_8);

        when(paymentRepository.findBySepayTransactionId(92707L)).thenReturn(Optional.empty());
        when(paymentRepository.findByPaymentCodeIgnoreCase("HMS30")).thenReturn(Optional.of(payment));
        when(bookingRepository.findByIdForPaymentUpdate(10L)).thenReturn(Optional.of(booking));
        when(bookingDetailRepository.findByBookingId(10L)).thenReturn(List.of(detail));

        service.handleWebhook(body, "", "", "Apikey " + SECRET);

        assertEquals("SUCCESS", payment.getStatus());
        assertEquals(92707L, payment.getSepayTransactionId());
        verify(paymentRepository).save(payment);
    }

    @Test
    void handleWebhookMatchesAccountNumberWithoutLeadingZeros() {
        Booking booking = Booking.builder().id(10L).status("PENDING").build();
        Invoice invoice = Invoice.builder().id(20L).booking(booking).build();
        Payment payment = Payment.builder()
                .id(30L)
                .invoice(invoice)
                .paymentCode("HMS30")
                .amount(BigDecimal.valueOf(250_000))
                .status("PENDING")
                .build();
        BookingDetail detail = BookingDetail.builder().id(40L).booking(booking).status("PENDING").build();
        // accountNumber configured in service is "0123456789", payload sends "123456789"
        String json = """
                {
                  "id": 92708,
                  "gateway": "TPBank",
                  "transactionDate": "2026-06-14 13:00:00",
                  "accountNumber": "123456789",
                  "code": "HMS30",
                  "content": "HMS30",
                  "transferType": "in",
                  "description": "HMS30",
                  "transferAmount": 250000,
                  "referenceCode": "FT2600003"
                }
                """;
        byte[] body = json.getBytes(StandardCharsets.UTF_8);

        when(paymentRepository.findBySepayTransactionId(92708L)).thenReturn(Optional.empty());
        when(paymentRepository.findByPaymentCodeIgnoreCase("HMS30")).thenReturn(Optional.of(payment));
        when(bookingRepository.findByIdForPaymentUpdate(10L)).thenReturn(Optional.of(booking));
        when(bookingDetailRepository.findByBookingId(10L)).thenReturn(List.of(detail));

        service.handleWebhook(body, "", "", "Bearer " + SECRET);

        assertEquals("SUCCESS", payment.getStatus());
        assertEquals(92708L, payment.getSepayTransactionId());
        verify(paymentRepository).save(payment);
    }

    private byte[] webhookBody(long id, long amount) {
        return webhookBody(id, amount, "HMS30");
    }

    private byte[] webhookBody(long id, long amount, String code) {
        String json = """
                {
                  "id": %d,
                  "gateway": "Vietcombank",
                  "transactionDate": "2026-06-14 13:00:00",
                  "accountNumber": "0123456789",
                  "subAccount": "",
                  "code": "%s",
                  "content": "%s",
                  "transferType": "in",
                  "description": "Thanh toan booking",
                  "transferAmount": %d,
                  "accumulated": 1000000,
                  "referenceCode": "FT2600001"
                }
                """.formatted(id, code, code, amount);
        return json.getBytes(StandardCharsets.UTF_8);
    }

    private String signature(byte[] body, String timestamp) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        mac.update((timestamp + ".").getBytes(StandardCharsets.UTF_8));
        return "sha256=" + HexFormat.of().formatHex(mac.doFinal(body));
    }
}
