package com.homestayManagement.homestayManagement.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.homestayManagement.homestayManagement.dto.request.SePayWebhookRequest;
import com.homestayManagement.homestayManagement.dto.response.PublicBookingPaymentStatusResponse;
import com.homestayManagement.homestayManagement.dto.response.SePayPaymentResponse;
import com.homestayManagement.homestayManagement.entity.*;
import com.homestayManagement.homestayManagement.repository.*;
import com.homestayManagement.homestayManagement.service.SePayPaymentService;
import com.homestayManagement.homestayManagement.service.StayAccessService;
import com.homestayManagement.homestayManagement.service.event.PublicBookingConfirmationEmailEvent;
import com.homestayManagement.homestayManagement.service.support.BookingInventoryPolicy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
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
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class SePayPaymentServiceImpl implements SePayPaymentService {

    private static final long WEBHOOK_MAX_AGE_SECONDS = 300;
    private final BookingRepository bookingRepository;
    private final BookingDetailRepository bookingDetailRepository;
    private final RoomRepository roomRepository;
    private final RoomTypeRepository roomTypeRepository;
    private final BookingServiceItemRepository bookingServiceItemRepository;
    private final CheckInRecordRepository checkInRecordRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final ServiceUsageRepository serviceUsageRepository;
    private final InventoryServiceRepository inventoryServiceRepository;
    private final StayAccessService stayAccessService;
    private final ObjectMapper objectMapper;
    private final ApplicationEventPublisher eventPublisher;
    private final String bankName;
    private final String accountNumber;
    private final String accountHolder;
    private final String paymentCodePrefix;
    private final String transferPrefix;
    private final String webhookSecret;
    public SePayPaymentServiceImpl(
            BookingRepository bookingRepository,
            BookingDetailRepository bookingDetailRepository,
            RoomRepository roomRepository,
            RoomTypeRepository roomTypeRepository,
            BookingServiceItemRepository bookingServiceItemRepository,
            CheckInRecordRepository checkInRecordRepository,
            InvoiceRepository invoiceRepository,
            PaymentRepository paymentRepository,
            ServiceUsageRepository serviceUsageRepository,
            InventoryServiceRepository inventoryServiceRepository,
            StayAccessService stayAccessService,
            ObjectMapper objectMapper,
            ApplicationEventPublisher eventPublisher,
            @Value("${sepay.bank-name:}") String bankName,
            @Value("${sepay.account-number:}") String accountNumber,
            @Value("${sepay.account-holder:}") String accountHolder,
            @Value("${sepay.payment-code-prefix:HMS}") String paymentCodePrefix,
            @Value("${sepay.transfer-prefix:}") String transferPrefix,
            @Value("${sepay.webhook-secret:}") String webhookSecret
    ) {
        this.bookingRepository = bookingRepository;
        this.bookingDetailRepository = bookingDetailRepository;
        this.roomRepository = roomRepository;
        this.roomTypeRepository = roomTypeRepository;
        this.bookingServiceItemRepository = bookingServiceItemRepository;
        this.checkInRecordRepository = checkInRecordRepository;
        this.invoiceRepository = invoiceRepository;
        this.paymentRepository = paymentRepository;
        this.serviceUsageRepository = serviceUsageRepository;
        this.inventoryServiceRepository = inventoryServiceRepository;
        this.stayAccessService = stayAccessService;
        this.objectMapper = objectMapper;
        this.eventPublisher = eventPublisher;
        this.bankName = bankName;
        this.accountNumber = accountNumber;
        this.accountHolder = accountHolder;
        this.paymentCodePrefix = paymentCodePrefix;
        this.transferPrefix = transferPrefix;
        this.webhookSecret = webhookSecret;
    }

    @Override
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public SePayPaymentResponse createPayment(String email, Long bookingId) {
        return createBookingPayment(bookingId, email);
    }

    @Override
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public SePayPaymentResponse createPublicBookingPayment(Long bookingId, String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Vui long nhap email dat phong");
        }
        return createBookingPayment(bookingId, email.trim());
    }

    @Override
    @Transactional(readOnly = true)
    public PublicBookingPaymentStatusResponse getPublicBookingPaymentStatus(Long bookingId, String email) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay booking"));
        ensureBookingEmailMatches(booking, email);
        return new PublicBookingPaymentStatusResponse(
                booking.getId(),
                booking.getBookingCode(),
                booking.getStatus()
        );
    }

    @Override
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public SePayPaymentResponse createBookingPaymentForAdmin(Long bookingId) {
        return createBookingPayment(bookingId, null);
    }

    private SePayPaymentResponse createBookingPayment(Long bookingId, String customerEmail) {
        validatePaymentConfiguration();
        Booking booking = bookingRepository.findByIdForPaymentUpdate(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy booking"));
        if (customerEmail != null) {
            ensureBookingEmailMatches(booking, customerEmail);
        }
        if (!"PENDING".equalsIgnoreCase(booking.getStatus())) {
            throw new IllegalArgumentException("Booking này không ở trạng thái chờ thanh toán");
        }

        List<BookingDetail> details = bookingDetailRepository.findByBookingId(bookingId);
        if (details.isEmpty()) {
            throw new IllegalArgumentException("Booking không có chi tiết phòng");
        }
        ensureInventoryAvailable(details, booking.getId());
        booking.setPaymentHoldExpiresAt(null);
        bookingRepository.save(booking);

        Invoice invoice = getOrCreateInvoice(booking, details);
        BigDecimal amount = calculateRequiredPayment(booking, details, invoice.getTotalAmount());

        Payment payment = paymentRepository
                .findFirstByInvoiceIdAndPaymentMethodAndPaymentPurposeAndStatusOrderByIdDesc(
                        invoice.getId(), "SEPAY", "BOOKING", "PENDING"
                )
                .orElse(null);
        if (payment == null) {
            payment = paymentRepository.save(Payment.builder()
                    .invoice(invoice)
                    .paymentMethod("SEPAY")
                    .paymentPurpose("BOOKING")
                    .amount(amount)
                    .status("PENDING")
                    .build());
            payment.setPaymentCode(normalizedPaymentCodePrefix() + payment.getId());
        }

        String transferContent = transferPrefix.trim() + payment.getPaymentCode();
        payment.setAmount(amount);
        payment.setQrCodeUrl(buildQrCodeUrl(amount, transferContent));
        payment = paymentRepository.save(payment);
        return toResponse(booking, payment, transferContent);
    }

    @Override
    @Transactional
    public SePayPaymentResponse createCheckoutPayment(Long bookingId, Long bookingDetailId, BigDecimal amount) {
        validatePaymentConfiguration();
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Chi phí phát sinh phải lớn hơn 0");
        }
        Booking booking = bookingRepository.findByIdForPaymentUpdate(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy booking"));
        if (!"CHECKED_IN".equalsIgnoreCase(booking.getStatus())) {
            throw new IllegalArgumentException("Booking chưa ở trạng thái lưu trú");
        }
        Invoice invoice = invoiceRepository.findByBookingIdForAdmin(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Chưa tạo hóa đơn checkout"));

        BookingDetail bookingDetail = bookingDetailRepository.findById(bookingDetailId)
                .filter(detail -> detail.getBooking() != null && bookingId.equals(detail.getBooking().getId()))
                .orElseThrow(() -> new IllegalArgumentException("Phòng checkout không thuộc booking"));

        Payment payment = paymentRepository
                .findFirstByInvoiceIdAndBookingDetailIdAndPaymentMethodAndPaymentPurposeAndStatusOrderByIdDesc(
                        invoice.getId(), bookingDetailId, "SEPAY", "CHECKOUT", "PENDING"
                )
                .orElse(null);
        if (payment != null && !sameAmount(payment.getAmount(), amount)) {
            payment.setStatus("FAILED");
            paymentRepository.save(payment);
            payment = null;
        }
        if (payment == null) {
            payment = paymentRepository.save(Payment.builder()
                    .invoice(invoice)
                    .bookingDetail(bookingDetail)
                    .paymentMethod("SEPAY")
                    .paymentPurpose("CHECKOUT")
                    .amount(amount)
                    .status("PENDING")
                    .build());
            payment.setPaymentCode(normalizedPaymentCodePrefix() + payment.getId());
        }

        String transferContent = transferPrefix.trim() + payment.getPaymentCode();
        payment.setBookingDetail(bookingDetail);
        payment.setAmount(amount);
        payment.setQrCodeUrl(buildQrCodeUrl(amount, transferContent));
        payment = paymentRepository.save(payment);
        return toResponse(booking, payment, transferContent);
    }

    private boolean sameAmount(BigDecimal first, BigDecimal second) {
        return first != null && second != null && first.compareTo(second) == 0;
    }

    @Override
    @Transactional(isolation = Isolation.READ_COMMITTED)
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
        List<BookingDetail> bookingDetails = List.of();
        if (!"CHECKOUT".equalsIgnoreCase(payment.getPaymentPurpose())) {
            bookingDetails = bookingDetailRepository.findByBookingId(booking.getId());
            try {
                ensureInventoryAvailable(bookingDetails, booking.getId());
            } catch (IllegalArgumentException conflict) {
                payment.setSepayTransactionId(webhook.id());
                payment.setTransactionNo(blankToFallback(webhook.referenceCode(), String.valueOf(webhook.id())));
                payment.setStatus("REVIEW_REQUIRED");
                payment.setPaymentTime(LocalDateTime.now());
                paymentRepository.save(payment);
                booking.setPaymentHoldExpiresAt(null);
                bookingRepository.save(booking);
                return;
            }
        }
        payment.setSepayTransactionId(webhook.id());
        payment.setTransactionNo(blankToFallback(webhook.referenceCode(), String.valueOf(webhook.id())));
        payment.setStatus("SUCCESS");
        payment.setPaymentTime(LocalDateTime.now());
        paymentRepository.save(payment);

        if ("CHECKOUT".equalsIgnoreCase(payment.getPaymentPurpose())) {
            completeCheckout(booking, payment.getBookingDetail());
        } else {
            booking.setStatus("CONFIRMED");
            booking.setPaymentHoldExpiresAt(null);
            bookingRepository.save(booking);
            bookingDetails.forEach(detail -> detail.setStatus("CONFIRMED"));
            bookingDetailRepository.saveAll(bookingDetails);
            publishGuestPaymentConfirmationEmail(booking, bookingDetails, payment);
        }
    }

    private void ensureBookingEmailMatches(Booking booking, String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Vui long nhap email dat phong");
        }
        String ownerEmail = bookingEmail(booking);
        if (ownerEmail == null || !email.trim().equalsIgnoreCase(ownerEmail)) {
            throw new IllegalArgumentException("Email khong khop voi booking nay");
        }
    }

    private String bookingEmail(Booking booking) {
        Customer customer = booking.getCustomer();
        if (customer == null) {
            return null;
        }
        if (customer.getAccount() != null && customer.getAccount().getEmail() != null) {
            return customer.getAccount().getEmail();
        }
        return customer.getEmail();
    }

    private void publishGuestPaymentConfirmationEmail(Booking booking, List<BookingDetail> bookingDetails, Payment payment) {
        Customer customer = booking.getCustomer();
        if (customer == null || customer.getAccount() != null || customer.getEmail() == null || customer.getEmail().isBlank()) {
            return;
        }
        Invoice invoice = payment.getInvoice();
        BigDecimal roomCharge = invoice != null ? zero(invoice.getRoomCharge()) : bookingDetails.stream()
                .map(this::finalRoomAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal serviceCharge = invoice != null ? zero(invoice.getServiceCharge()) : BigDecimal.ZERO;
        BigDecimal totalAmount = invoice != null ? zero(invoice.getTotalAmount()) : roomCharge.add(serviceCharge);
        eventPublisher.publishEvent(new PublicBookingConfirmationEmailEvent(
                customer.getEmail(),
                customer.getFullName(),
                booking.getBookingCode(),
                bookingDetails.stream().map(BookingDetail::getCheckInTarget).filter(Objects::nonNull).min(LocalDateTime::compareTo).orElse(null),
                bookingDetails.stream().map(BookingDetail::getCheckOutTarget).filter(Objects::nonNull).max(LocalDateTime::compareTo).orElse(null),
                roomCharge,
                serviceCharge,
                totalAmount,
                false,
                zero(payment.getAmount()),
                true,
                bookingDetails.stream().map(detail -> new PublicBookingConfirmationEmailEvent.RoomLine(
                        roomTypeName(detail),
                        detail.getNumberOfAdults(),
                        detail.getNumberOfChildren(),
                        finalRoomAmount(detail)
                )).toList()
        ));
    }

    private String roomTypeName(BookingDetail detail) {
        Room room = detail.getRoom();
        RoomType roomType = detail.getRoomType() != null ? detail.getRoomType() : room != null ? room.getRoomType() : null;
        return roomType != null ? roomType.getName() : "Phong da dat";
    }

    private Invoice getOrCreateInvoice(Booking booking, List<BookingDetail> details) {
        return invoiceRepository.findByBookingIdForAdmin(booking.getId())
                .orElseGet(() -> {
                    BigDecimal roomCharge = details.stream()
                            .map(this::finalRoomAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    List<Long> detailIds = details.stream().map(BookingDetail::getId).toList();
                    BigDecimal serviceCharge = bookingServiceItemRepository.findByBookingDetailIds(detailIds).stream()
                            .map(item -> item.getPriceAtBooking().multiply(BigDecimal.valueOf(item.getQuantity())))
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    return invoiceRepository.save(Invoice.builder()
                            .booking(booking)
                            .roomCharge(roomCharge)
                            .roomDiscountAmount(zero(booking.getRoomDiscountAmount()))
                            .serviceCharge(serviceCharge)
                            .penaltyCharge(BigDecimal.ZERO)
                            .totalAmount(roomCharge.add(serviceCharge))
                            .createdAt(LocalDateTime.now())
                            .build());
                });
    }

    private void completeCheckout(Booking booking, BookingDetail paidDetail) {
        // Historical checkout payments have no room reference, so retain their old behavior.
        if (paidDetail == null) {
            completeLegacyCheckout(booking);
            return;
        }

        checkInRecordRepository.findByBookingDetailId(paidDetail.getId()).ifPresent(record -> {
            if (record.getActualCheckOut() == null) {
                record.setActualCheckOut(LocalDateTime.now());
                checkInRecordRepository.save(record);
            }
        });

        restoreInventoryServices(List.of(paidDetail));
        paidDetail.setStatus("COMPLETED");
        bookingDetailRepository.save(paidDetail);
        stayAccessService.expireAccess(paidDetail.getId());
        if (paidDetail.getRoom() != null) {
            paidDetail.getRoom().setStatus("AVAILABLE");
            roomRepository.save(paidDetail.getRoom());
        }

        List<BookingDetail> details = bookingDetailRepository.findByBookingId(booking.getId());
        boolean allClosed = details.stream()
                .allMatch(detail -> "COMPLETED".equalsIgnoreCase(detail.getStatus())
                        || "CANCELLED".equalsIgnoreCase(detail.getStatus()));
        booking.setStatus(allClosed ? "COMPLETED" : "CHECKED_IN");
        bookingRepository.save(booking);
    }

    private void completeLegacyCheckout(Booking booking) {
        List<CheckInRecord> records = checkInRecordRepository.findByBookingIdForInvoice(booking.getId());
        LocalDateTime now = LocalDateTime.now();
        records.stream()
                .filter(record -> record.getActualCheckOut() == null)
                .forEach(record -> record.setActualCheckOut(now));
        checkInRecordRepository.saveAll(records);

        List<BookingDetail> details = bookingDetailRepository.findByBookingId(booking.getId());
        restoreInventoryServices(details);
        details.forEach(detail -> {
            detail.setStatus("COMPLETED");
            stayAccessService.expireAccess(detail.getId());
            if (detail.getRoom() != null) {
                detail.getRoom().setStatus("AVAILABLE");
                roomRepository.save(detail.getRoom());
            }
        });
        bookingDetailRepository.saveAll(details);
        booking.setStatus("COMPLETED");
        bookingRepository.save(booking);
    }

    private void restoreInventoryServices(List<BookingDetail> details) {
        List<Long> detailIds = details.stream().map(BookingDetail::getId).toList();
        if (detailIds.isEmpty()) {
            return;
        }
        bookingServiceItemRepository.findByBookingDetailIds(detailIds).stream()
                .filter(item -> item.getInventoryService() != null)
                .forEach(item -> restoreInventoryStock(item.getInventoryService(), item.getQuantity()));
        detailIds.forEach(detailId -> serviceUsageRepository.findByBookingDetailIdForAdmin(detailId).stream()
                .filter(usage -> usage.getInventoryService() != null)
                .forEach(usage -> restoreInventoryStock(usage.getInventoryService(), usage.getQuantity())));
    }

    private void restoreInventoryStock(InventoryService service, Integer quantity) {
        if (service == null || service.getQuantityInStock() == null || quantity == null || quantity <= 0) {
            return;
        }
        service.setQuantityInStock(service.getQuantityInStock() + quantity);
        inventoryServiceRepository.save(service);
    }

    private BigDecimal calculateRequiredPayment(Booking booking, List<BookingDetail> details, BigDecimal totalAmount) {
        boolean hourly = details.stream()
                .map(BookingDetail::getRentType)
                .map(this::normalize)
                .anyMatch(type -> "HOURLY".equals(type) || "BY_HOUR".equals(type));
        if (hourly) {
            return details.stream()
                    .map(this::finalRoomAmount)
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

    private SePayPaymentResponse toResponse(Booking booking, Payment payment, String transferContent) {
        return new SePayPaymentResponse(
                booking.getId(),
                booking.getBookingCode(),
                payment.getId(),
                payment.getAmount(),
                payment.getPaymentCode(),
                transferContent,
                bankName,
                accountNumber,
                accountHolder,
                payment.getQrCodeUrl(),
                null
        );
    }

    private void ensureInventoryAvailable(
            List<BookingDetail> requestedDetails,
            Long currentBookingId
    ) {
        Map<AvailabilityKey, Long> requestedBySlot = requestedDetails.stream()
                .filter(detail -> detail.getRoomType() != null)
                .collect(Collectors.groupingBy(
                        detail -> new AvailabilityKey(
                                detail.getRoomType().getId(),
                                detail.getCheckInTarget(),
                                detail.getCheckOutTarget()
                        ),
                        Collectors.counting()
                ));
        List<Long> roomTypeIds = requestedBySlot.keySet().stream()
                .map(AvailabilityKey::roomTypeId)
                .filter(Objects::nonNull)
                .distinct()
                .sorted()
                .toList();
        if (!roomTypeIds.isEmpty()) {
            roomTypeRepository.findAllByIdForInventoryUpdate(roomTypeIds);
        }

        for (BookingDetail requestedDetail : requestedDetails) {
            if (requestedDetail.getRoom() == null) {
                continue;
            }
            boolean assignedRoomOccupied = bookingDetailRepository
                    .findOverlappingSchedule(
                            requestedDetail.getCheckInTarget(),
                            requestedDetail.getCheckOutTarget()
                    )
                    .stream()
                    .filter(detail -> detail.getBooking() != null)
                    .filter(detail -> !Objects.equals(detail.getBooking().getId(), currentBookingId))
                    .filter(detail -> detail.getRoom() != null
                            && Objects.equals(detail.getRoom().getId(), requestedDetail.getRoom().getId()))
                    .anyMatch(BookingInventoryPolicy::blocksInventory);
            if (assignedRoomOccupied) {
                throw new IllegalArgumentException(
                        "Phòng vừa được khách khác xác nhận. Vui lòng chọn phòng khác."
                );
            }
        }

        List<AvailabilityKey> orderedSlots = new ArrayList<>(requestedBySlot.keySet());
        orderedSlots.sort(Comparator.comparing(AvailabilityKey::roomTypeId)
                .thenComparing(AvailabilityKey::checkInTarget)
                .thenComparing(AvailabilityKey::checkOutTarget));
        for (AvailabilityKey slot : orderedSlots) {
            long occupiedRooms = bookingDetailRepository
                    .findOverlappingSchedule(slot.checkInTarget(), slot.checkOutTarget())
                    .stream()
                    .filter(detail -> detail.getBooking() != null)
                    .filter(detail -> !Objects.equals(detail.getBooking().getId(), currentBookingId))
                    .filter(detail -> detail.getRoomType() != null
                            && Objects.equals(detail.getRoomType().getId(), slot.roomTypeId()))
                    .filter(BookingInventoryPolicy::blocksInventory)
                    .count();
            int totalRooms = roomRepository.findByRoomTypeId(slot.roomTypeId()).size();
            if (totalRooms - occupiedRooms < requestedBySlot.get(slot)) {
                throw new IllegalArgumentException(
                        "Phòng vừa được khách khác xác nhận. Vui lòng chọn phòng khác."
                );
            }
        }
    }

    private record AvailabilityKey(
            Long roomTypeId,
            LocalDateTime checkInTarget,
            LocalDateTime checkOutTarget
    ) {
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

    private BigDecimal finalRoomAmount(BookingDetail detail) {
        BigDecimal finalAmount = zero(detail.getPriceAtBooking()).subtract(zero(detail.getAllocatedDiscount()));
        return finalAmount.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : finalAmount;
    }

    private BigDecimal zero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private String blankToFallback(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase();
    }
}
