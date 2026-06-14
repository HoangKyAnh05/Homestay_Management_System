package com.homestayManagement.homestayManagement.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.homestayManagement.homestayManagement.dto.request.SePayWebhookRequest;
import com.homestayManagement.homestayManagement.dto.response.SePayPaymentResponse;
import com.homestayManagement.homestayManagement.entity.*;
import com.homestayManagement.homestayManagement.repository.*;
import com.homestayManagement.homestayManagement.service.SePayPaymentService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.UriComponentsBuilder;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;

@Service
public class SePayPaymentServiceImpl implements SePayPaymentService {

    private static final long WEBHOOK_MAX_AGE_SECONDS = 300;

    private final BookingRepository bookingRepository;
    private final BookingDetailRepository bookingDetailRepository;
    private final BookingServiceItemRepository bookingServiceItemRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final ObjectMapper objectMapper;
    private final String bankName;
    private final String accountNumber;
    private final String accountHolder;
    private final String paymentCodePrefix;
    private final String transferPrefix;
    private final String webhookSecret;

    public SePayPaymentServiceImpl(
            BookingRepository bookingRepository,
            BookingDetailRepository bookingDetailRepository,
            BookingServiceItemRepository bookingServiceItemRepository,
            InvoiceRepository invoiceRepository,
            PaymentRepository paymentRepository,
            ObjectMapper objectMapper,
            @Value("${sepay.bank-name:}") String bankName,
            @Value("${sepay.account-number:}") String accountNumber,
            @Value("${sepay.account-holder:}") String accountHolder,
            @Value("${sepay.payment-code-prefix:HMS}") String paymentCodePrefix,
            @Value("${sepay.transfer-prefix:}") String transferPrefix,
            @Value("${sepay.webhook-secret:}") String webhookSecret
    ) {
        this.bookingRepository = bookingRepository;
        this.bookingDetailRepository = bookingDetailRepository;
        this.bookingServiceItemRepository = bookingServiceItemRepository;
        this.invoiceRepository = invoiceRepository;
        this.paymentRepository = paymentRepository;
        this.objectMapper = objectMapper;
        this.bankName = bankName;
        this.accountNumber = accountNumber;
        this.accountHolder = accountHolder;
        this.paymentCodePrefix = paymentCodePrefix;
        this.transferPrefix = transferPrefix;
        this.webhookSecret = webhookSecret;
    }

    @Override
    @Transactional
    public SePayPaymentResponse createPayment(String email, Long bookingId) {
        validatePaymentConfiguration();
        Booking booking = bookingRepository.findByIdForPaymentUpdate(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy booking"));
        String ownerEmail = booking.getCustomer().getAccount() != null
                ? booking.getCustomer().getAccount().getEmail()
                : null;
        if (ownerEmail == null || !email.equalsIgnoreCase(ownerEmail)) {
            throw new IllegalArgumentException("Bạn không có quyền thanh toán booking này");
        }
        if (!"PENDING".equalsIgnoreCase(booking.getStatus())) {
            throw new IllegalArgumentException("Booking này không ở trạng thái chờ thanh toán");
        }

        List<BookingDetail> details = bookingDetailRepository.findByBookingId(bookingId);
        if (details.isEmpty()) {
            throw new IllegalArgumentException("Booking không có chi tiết phòng");
        }
        Invoice invoice = getOrCreateInvoice(booking, details);
        BigDecimal amount = calculateRequiredPayment(booking, details, invoice.getTotalAmount());

        Payment payment = paymentRepository
                .findFirstByInvoiceIdAndPaymentMethodAndStatusOrderByIdDesc(invoice.getId(), "SEPAY", "PENDING")
                .orElse(null);
        if (payment == null) {
            payment = paymentRepository.save(Payment.builder()
                    .invoice(invoice)
                    .paymentMethod("SEPAY")
                    .amount(amount)
                    .status("PENDING")
                    .build());
            payment.setPaymentCode(normalizedPaymentCodePrefix() + payment.getId());
        }

        String transferContent = transferPrefix.trim() + payment.getPaymentCode();
        payment.setAmount(amount);
        payment.setQrCodeUrl(buildQrCodeUrl(amount, transferContent));
        payment = paymentRepository.save(payment);
        return toResponse(bookingId, payment, transferContent);
    }

    @Override
    @Transactional
    public void handleWebhook(byte[] rawBody, String signature, String timestamp) {
        verifySignature(rawBody, signature, timestamp);
        SePayWebhookRequest webhook = readWebhook(rawBody);
        validateWebhook(webhook);

        if (paymentRepository.findBySepayTransactionId(webhook.id()).isPresent()) {
            return;
        }

        Payment payment = paymentRepository.findByPaymentCodeIgnoreCase(webhook.code()).orElse(null);
        if (payment == null) {
            // A valid SePay test payload or an unrelated transfer must not trigger retries.
            return;
        }
        if ("SUCCESS".equalsIgnoreCase(payment.getStatus())) {
            return;
        }
        if (webhook.transferAmount().compareTo(payment.getAmount()) < 0) {
            throw new IllegalArgumentException("Số tiền SePay nhận được chưa đủ");
        }

        Booking booking = bookingRepository.findByIdForPaymentUpdate(payment.getInvoice().getBooking().getId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy booking của giao dịch"));
        payment.setSepayTransactionId(webhook.id());
        payment.setTransactionNo(blankToFallback(webhook.referenceCode(), String.valueOf(webhook.id())));
        payment.setStatus("SUCCESS");
        payment.setPaymentTime(LocalDateTime.now());
        paymentRepository.save(payment);

        booking.setStatus("CONFIRMED");
        bookingRepository.save(booking);
        List<BookingDetail> details = bookingDetailRepository.findByBookingId(booking.getId());
        details.forEach(detail -> detail.setStatus("CONFIRMED"));
        bookingDetailRepository.saveAll(details);
    }

    private Invoice getOrCreateInvoice(Booking booking, List<BookingDetail> details) {
        return invoiceRepository.findByBookingIdForAdmin(booking.getId())
                .orElseGet(() -> {
                    BigDecimal roomCharge = details.stream()
                            .map(BookingDetail::getPriceAtBooking)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    List<Long> detailIds = details.stream().map(BookingDetail::getId).toList();
                    BigDecimal serviceCharge = bookingServiceItemRepository.findByBookingDetailIds(detailIds).stream()
                            .map(item -> item.getPriceAtBooking().multiply(BigDecimal.valueOf(item.getQuantity())))
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    return invoiceRepository.save(Invoice.builder()
                            .booking(booking)
                            .roomCharge(roomCharge)
                            .serviceCharge(serviceCharge)
                            .penaltyCharge(BigDecimal.ZERO)
                            .totalAmount(roomCharge.add(serviceCharge))
                            .createdAt(LocalDateTime.now())
                            .build());
                });
    }

    private BigDecimal calculateRequiredPayment(Booking booking, List<BookingDetail> details, BigDecimal totalAmount) {
        boolean hourly = details.stream()
                .map(BookingDetail::getRentType)
                .map(this::normalize)
                .anyMatch(type -> "HOURLY".equals(type) || "BY_HOUR".equals(type));
        if (hourly) {
            return details.stream()
                    .map(BookingDetail::getPriceAtBooking)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }
        DepositPolicy policy = booking.getDepositPolicy();
        if (policy == null || policy.getPolicyValue() == null) {
            throw new IllegalArgumentException("Booking không có khoản cần thanh toán");
        }
        if ("PERCENTAGE".equals(normalize(policy.getCalculationType()))) {
            return totalAmount.multiply(policy.getPolicyValue())
                    .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
        }
        return policy.getPolicyValue();
    }

    private String buildQrCodeUrl(BigDecimal amount, String transferContent) {
        long wholeAmount;
        try {
            wholeAmount = amount.setScale(0, RoundingMode.UNNECESSARY).longValueExact();
        } catch (ArithmeticException exception) {
            throw new IllegalArgumentException("SePay chỉ hỗ trợ số tiền VND nguyên");
        }
        return UriComponentsBuilder.fromUriString("https://qr.sepay.vn/img")
                .queryParam("acc", accountNumber)
                .queryParam("bank", bankName)
                .queryParam("amount", wholeAmount)
                .queryParam("des", transferContent)
                .queryParam("template", "compact")
                .queryParam("showinfo", "true")
                .queryParam("holder", accountHolder)
                .build()
                .encode(StandardCharsets.UTF_8)
                .toUriString();
    }

    private void verifySignature(byte[] rawBody, String signature, String timestamp) {
        if (webhookSecret.isBlank()) {
            throw new IllegalStateException("SePay chưa được cấu hình webhook secret");
        }
        long timestampValue;
        try {
            timestampValue = Long.parseLong(timestamp);
        } catch (NumberFormatException exception) {
            throw new IllegalArgumentException("Webhook SePay thiếu timestamp hợp lệ");
        }
        if (Math.abs(Instant.now().getEpochSecond() - timestampValue) > WEBHOOK_MAX_AGE_SECONDS) {
            throw new IllegalArgumentException("Webhook SePay đã hết hạn");
        }
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(webhookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            mac.update((timestamp + ".").getBytes(StandardCharsets.UTF_8));
            String expected = "sha256=" + HexFormat.of().formatHex(mac.doFinal(rawBody));
            if (!MessageDigest.isEqual(
                    expected.getBytes(StandardCharsets.UTF_8),
                    blankToFallback(signature, "").getBytes(StandardCharsets.UTF_8)
            )) {
                throw new IllegalArgumentException("Chữ ký webhook SePay không hợp lệ");
            }
        } catch (IllegalArgumentException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new IllegalStateException("Không thể xác minh webhook SePay", exception);
        }
    }

    private SePayWebhookRequest readWebhook(byte[] rawBody) {
        try {
            return objectMapper.readValue(rawBody, SePayWebhookRequest.class);
        } catch (Exception exception) {
            throw new IllegalArgumentException("Payload webhook SePay không hợp lệ", exception);
        }
    }

    private void validateWebhook(SePayWebhookRequest webhook) {
        if (webhook.id() == null || webhook.transferAmount() == null) {
            throw new IllegalArgumentException("Webhook SePay thiếu dữ liệu giao dịch");
        }
        if (!"in".equalsIgnoreCase(webhook.transferType())) {
            throw new IllegalArgumentException("Webhook SePay không phải giao dịch tiền vào");
        }
        if (webhook.code() == null || webhook.code().isBlank()) {
            throw new IllegalArgumentException("Webhook SePay không có mã thanh toán");
        }
        if (!accountNumber.equals(webhook.accountNumber())) {
            throw new IllegalArgumentException("Tài khoản nhận tiền SePay không khớp");
        }
    }

    private SePayPaymentResponse toResponse(Long bookingId, Payment payment, String transferContent) {
        return new SePayPaymentResponse(
                bookingId,
                payment.getId(),
                payment.getAmount(),
                payment.getPaymentCode(),
                transferContent,
                bankName,
                accountNumber,
                accountHolder,
                payment.getQrCodeUrl()
        );
    }

    private void validatePaymentConfiguration() {
        if (bankName.isBlank() || accountNumber.isBlank() || accountHolder.isBlank()) {
            throw new IllegalStateException("SePay chưa được cấu hình tài khoản nhận tiền");
        }
        if (!normalizedPaymentCodePrefix().matches("[A-Z]+")) {
            throw new IllegalStateException("Tiền tố mã thanh toán SePay chỉ được chứa chữ cái");
        }
    }

    private String normalizedPaymentCodePrefix() {
        return normalize(paymentCodePrefix);
    }

    private String blankToFallback(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase();
    }
}
