package com.homestayManagement.homestayManagement.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.homestayManagement.homestayManagement.entity.Booking;
import com.homestayManagement.homestayManagement.entity.BookingDetail;
import com.homestayManagement.homestayManagement.entity.Invoice;
import com.homestayManagement.homestayManagement.entity.Payment;
import com.homestayManagement.homestayManagement.repository.BookingDetailRepository;
import com.homestayManagement.homestayManagement.repository.BookingRepository;
import com.homestayManagement.homestayManagement.repository.BookingServiceItemRepository;
import com.homestayManagement.homestayManagement.repository.InvoiceRepository;
import com.homestayManagement.homestayManagement.repository.PaymentRepository;
import com.homestayManagement.homestayManagement.service.impl.SePayPaymentServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
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
    private BookingServiceItemRepository bookingServiceItemRepository;
    @Mock
    private InvoiceRepository invoiceRepository;
    @Mock
    private PaymentRepository paymentRepository;

    private SePayPaymentServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new SePayPaymentServiceImpl(
                bookingRepository,
                bookingDetailRepository,
                bookingServiceItemRepository,
                invoiceRepository,
                paymentRepository,
                new ObjectMapper(),
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

    private byte[] webhookBody(long id, long amount) {
        String json = """
                {
                  "id": %d,
                  "gateway": "Vietcombank",
                  "transactionDate": "2026-06-14 13:00:00",
                  "accountNumber": "0123456789",
                  "subAccount": "",
                  "code": "HMS30",
                  "content": "HMS30",
                  "transferType": "in",
                  "description": "Thanh toan booking",
                  "transferAmount": %d,
                  "accumulated": 1000000,
                  "referenceCode": "FT2600001"
                }
                """.formatted(id, amount);
        return json.getBytes(StandardCharsets.UTF_8);
    }

    private String signature(byte[] body, String timestamp) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        mac.update((timestamp + ".").getBytes(StandardCharsets.UTF_8));
        return "sha256=" + HexFormat.of().formatHex(mac.doFinal(body));
    }
}
