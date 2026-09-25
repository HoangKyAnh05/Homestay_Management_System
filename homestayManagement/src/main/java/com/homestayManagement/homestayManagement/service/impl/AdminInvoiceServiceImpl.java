package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.response.AdminInvoiceResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminInvoicePenaltyItemResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminInvoiceServiceItemResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminPaymentResponse;
import com.homestayManagement.homestayManagement.entity.Customer;
import com.homestayManagement.homestayManagement.entity.Employee;
import com.homestayManagement.homestayManagement.entity.Invoice;
import com.homestayManagement.homestayManagement.entity.Payment;
import com.homestayManagement.homestayManagement.entity.RoomAmenitiesUsage;
import com.homestayManagement.homestayManagement.entity.ServiceUsage;
import com.homestayManagement.homestayManagement.entity.AppliedPenalty;
import com.homestayManagement.homestayManagement.entity.CheckInRecord;
import com.homestayManagement.homestayManagement.repository.AppliedPenaltyRepository;
import com.homestayManagement.homestayManagement.repository.CheckInRecordRepository;
import com.homestayManagement.homestayManagement.repository.InvoiceRepository;
import com.homestayManagement.homestayManagement.repository.PaymentRepository;
import com.homestayManagement.homestayManagement.repository.RoomAmenitiesUsageRepository;
import com.homestayManagement.homestayManagement.repository.ServiceUsageRepository;
import com.homestayManagement.homestayManagement.service.AdminInvoiceService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
public class AdminInvoiceServiceImpl implements AdminInvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final ServiceUsageRepository serviceUsageRepository;
    private final RoomAmenitiesUsageRepository roomAmenitiesUsageRepository;
    private final AppliedPenaltyRepository appliedPenaltyRepository;
    private final CheckInRecordRepository checkInRecordRepository;
    private final com.homestayManagement.homestayManagement.service.CheckoutInvoiceEmailService checkoutInvoiceEmailService;

    public AdminInvoiceServiceImpl(
            InvoiceRepository invoiceRepository,
            PaymentRepository paymentRepository,
            ServiceUsageRepository serviceUsageRepository,
            RoomAmenitiesUsageRepository roomAmenitiesUsageRepository,
            AppliedPenaltyRepository appliedPenaltyRepository,
            CheckInRecordRepository checkInRecordRepository,
            @org.springframework.beans.factory.annotation.Autowired(required = false)
            com.homestayManagement.homestayManagement.service.CheckoutInvoiceEmailService checkoutInvoiceEmailService
    ) {
        this.invoiceRepository = invoiceRepository;
        this.paymentRepository = paymentRepository;
        this.serviceUsageRepository = serviceUsageRepository;
        this.roomAmenitiesUsageRepository = roomAmenitiesUsageRepository;
        this.appliedPenaltyRepository = appliedPenaltyRepository;
        this.checkInRecordRepository = checkInRecordRepository;
        this.checkoutInvoiceEmailService = checkoutInvoiceEmailService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminInvoiceResponse> getAllInvoices() {
        List<Invoice> invoices = invoiceRepository.findAllForAdmin();
        if (invoices.isEmpty()) {
            return List.of();
        }
        return toResponsesBatch(invoices);
    }

    @Override
    @Transactional(readOnly = true)
    public AdminInvoiceResponse getInvoice(Long id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hóa đơn"));
        return toResponsesBatch(List.of(invoice)).get(0);
    }

    @Override
    @Transactional(readOnly = true)
    public String getInvoiceHtml(Long id) {
        if (checkoutInvoiceEmailService == null) {
            throw new IllegalStateException("Dịch vụ hóa đơn điện tử chưa sẵn sàng");
        }
        return checkoutInvoiceEmailService.renderHtml(id);
    }

    private List<AdminInvoiceResponse> toResponsesBatch(List<Invoice> invoices) {
        List<Long> invoiceIds = invoices.stream().map(Invoice::getId).toList();
        List<Long> bookingIds = invoices.stream()
                .map(i -> i.getBooking().getId())
                .distinct()
                .toList();

        // 1. Batch payments (1 query)
        java.util.Map<Long, List<Payment>> paymentsByInvoiceId = paymentRepository
                .findByInvoiceIdInOrderByPaymentTimeDescIdDesc(invoiceIds).stream()
                .collect(java.util.stream.Collectors.groupingBy(p -> p.getInvoice().getId()));

        // 2. Batch service usages (1 query)
        java.util.Map<Long, List<ServiceUsage>> serviceUsagesByBookingId = serviceUsageRepository
                .findByBookingIdsForInvoice(bookingIds).stream()
                .collect(java.util.stream.Collectors.groupingBy(s -> s.getCheckInRecord().getBookingDetail().getBooking().getId()));

        // 3. Batch amenities usages (1 query)
        java.util.Map<Long, List<RoomAmenitiesUsage>> amenitiesUsagesByBookingId = roomAmenitiesUsageRepository
                .findByBookingIdsForInvoice(bookingIds).stream()
                .collect(java.util.stream.Collectors.groupingBy(a -> a.getCheckInRecord().getBookingDetail().getBooking().getId()));

        // 4. Batch applied penalties (1 query)
        java.util.Map<Long, List<AppliedPenalty>> penaltiesByBookingId = appliedPenaltyRepository
                .findByBookingIdsForInvoice(bookingIds).stream()
                .collect(java.util.stream.Collectors.groupingBy(p -> p.getCheckRecord().getBookingDetail().getBooking().getId()));

        // 5. Batch check-in records (1 query)
        java.util.Map<Long, List<CheckInRecord>> checkInRecordsByBookingId = checkInRecordRepository
                .findByBookingIdsForInvoice(bookingIds).stream()
                .collect(java.util.stream.Collectors.groupingBy(c -> c.getBookingDetail().getBooking().getId()));

        return invoices.stream().map(invoice -> {
            List<Payment> payments = paymentsByInvoiceId.getOrDefault(invoice.getId(), List.of());
            List<AdminPaymentResponse> paymentResponses = payments.stream()
                    .map(this::toPaymentResponse)
                    .toList();
            Long bookingId = invoice.getBooking().getId();
            List<AdminInvoiceServiceItemResponse> serviceItems = buildServiceItemsFromBatch(
                    invoice.getServiceCharge(),
                    serviceUsagesByBookingId.getOrDefault(bookingId, List.of()),
                    amenitiesUsagesByBookingId.getOrDefault(bookingId, List.of())
            );
            List<AdminInvoicePenaltyItemResponse> penaltyItems = buildPenaltyItemsFromBatch(
                    invoice.getPenaltyCharge(),
                    penaltiesByBookingId.getOrDefault(bookingId, List.of()),
                    checkInRecordsByBookingId.getOrDefault(bookingId, List.of())
            );

            BigDecimal paidAmount = payments.stream()
                    .filter(payment -> "SUCCESS".equalsIgnoreCase(payment.getStatus()))
                    .map(Payment::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal remainingAmount = invoice.getTotalAmount().subtract(paidAmount);
            if (remainingAmount.compareTo(BigDecimal.ZERO) < 0) {
                remainingAmount = BigDecimal.ZERO;
            }

            Payment latestSuccessfulPayment = payments.stream()
                    .filter(p -> "SUCCESS".equalsIgnoreCase(p.getStatus()))
                    .max(Comparator
                            .comparing(Payment::getPaymentTime, Comparator.nullsFirst(Comparator.naturalOrder()))
                            .thenComparing(Payment::getId))
                    .orElse(null);

            Payment latestPayment = latestSuccessfulPayment != null ? latestSuccessfulPayment : payments.stream()
                    .max(Comparator
                            .comparing(Payment::getPaymentTime, Comparator.nullsFirst(Comparator.naturalOrder()))
                            .thenComparing(Payment::getId))
                    .orElse(null);

            boolean isCompletedStay = "COMPLETED".equalsIgnoreCase(invoice.getBooking().getStatus());
            boolean isFullySettled = remainingAmount.compareTo(BigDecimal.ZERO) <= 0;

            String resolvedStatus;
            String resolvedMethod = latestPayment != null ? latestPayment.getPaymentMethod() : null;
            LocalDateTime resolvedPaymentTime = latestPayment != null ? latestPayment.getPaymentTime() : null;

            if (isCompletedStay || isFullySettled) {
                resolvedStatus = "SUCCESS";
                if (resolvedMethod == null) {
                    if (invoice.getRoomDiscountAmount() != null && invoice.getRoomDiscountAmount().compareTo(BigDecimal.ZERO) > 0 && invoice.getTotalAmount().compareTo(BigDecimal.ZERO) == 0) {
                        resolvedMethod = "VOUCHER";
                    } else if (invoice.getTotalAmount().compareTo(BigDecimal.ZERO) == 0) {
                        resolvedMethod = "FREE";
                    } else {
                        resolvedMethod = "CASH";
                    }
                }
                if (resolvedPaymentTime == null) {
                    resolvedPaymentTime = invoice.getCreatedAt();
                }
            } else {
                resolvedStatus = latestPayment != null ? latestPayment.getStatus() : "PENDING";
            }

            Customer customer = invoice.getBooking().getCustomer();
            Employee employee = invoice.getEmployee();

            return new AdminInvoiceResponse(
                    invoice.getId(),
                    invoice.getBooking().getId(),
                    invoice.getBooking().getBookingCode(),
                    invoice.getBooking().getStatus(),
                    customer.getId(),
                    customer.getFullName(),
                    customer.getAccount() != null ? customer.getAccount().getEmail() : customer.getEmail(),
                    employee != null ? employee.getId() : null,
                    employee != null ? employee.getFullName() : "Thanh toan online",
                    invoice.getBooking().getVoucherCode(),
                    invoice.getBooking().getRoomChargeBeforeDiscount(),
                    invoice.getRoomDiscountAmount(),
                    invoice.getRoomCharge(),
                    invoice.getPenaltyCharge(),
                    invoice.getServiceCharge(),
                    invoice.getTotalAmount(),
                    paidAmount,
                    remainingAmount,
                    resolvedMethod,
                    resolvedStatus,
                    resolvedPaymentTime,
                    invoice.getCreatedAt(),
                    paymentResponses,
                    serviceItems,
                    penaltyItems
            );
        }).toList();
    }

    private AdminPaymentResponse toPaymentResponse(Payment payment) {
        return new AdminPaymentResponse(
                payment.getId(),
                payment.getPaymentMethod(),
                payment.getTransactionNo(),
                payment.getAmount(),
                payment.getStatus(),
                payment.getPaymentTime()
        );
    }

    private List<AdminInvoiceServiceItemResponse> buildServiceItemsFromBatch(
            BigDecimal invoiceServiceCharge,
            List<ServiceUsage> serviceUsages,
            List<RoomAmenitiesUsage> miniBarUsages
    ) {
        List<AdminInvoiceServiceItemResponse> sResponses = serviceUsages.stream()
                .map(this::toServiceItemResponse)
                .toList();
        List<AdminInvoiceServiceItemResponse> mResponses = miniBarUsages.stream()
                .map(this::toMiniBarItemResponse)
                .toList();

        List<AdminInvoiceServiceItemResponse> items = new java.util.ArrayList<>(
                java.util.stream.Stream.concat(sResponses.stream(), mResponses.stream()).toList()
        );
        BigDecimal detailTotal = items.stream()
                .map(AdminInvoiceServiceItemResponse::totalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal difference = invoiceServiceCharge.subtract(detailTotal);
        if (difference.compareTo(BigDecimal.ZERO) != 0) {
            items.add(new AdminInvoiceServiceItemResponse(
                    -1L,
                    "ADJUSTMENT",
                    "Khoản dịch vụ khác / điều chỉnh",
                    1,
                    difference,
                    difference
            ));
        }
        return items;
    }

    private AdminInvoiceServiceItemResponse toServiceItemResponse(ServiceUsage usage) {
        String type = usage.getFacilityService() != null ? "FACILITY" : "INVENTORY";
        String name = usage.getFacilityService() != null
                ? usage.getFacilityService().getName()
                : usage.getInventoryService().getName();
        BigDecimal totalPrice = usage.getPriceAtUse().multiply(BigDecimal.valueOf(usage.getQuantity()));
        return new AdminInvoiceServiceItemResponse(
                usage.getId(),
                type,
                name,
                usage.getQuantity(),
                usage.getPriceAtUse(),
                totalPrice
        );
    }

    private AdminInvoiceServiceItemResponse toMiniBarItemResponse(RoomAmenitiesUsage usage) {
        BigDecimal unitPrice = usage.getItem().getPrice();
        BigDecimal totalPrice = unitPrice.multiply(BigDecimal.valueOf(usage.getQuantityUsed()));
        return new AdminInvoiceServiceItemResponse(
                usage.getId(),
                "MINI_BAR",
                usage.getItem().getName(),
                usage.getQuantityUsed(),
                unitPrice,
                totalPrice
        );
    }

    private AdminInvoicePenaltyItemResponse toPenaltyItemResponse(AppliedPenalty penalty) {
        return new AdminInvoicePenaltyItemResponse(
                penalty.getId(),
                penalty.getRulesPenalty().getTitle(),
                penalty.getActualFine(),
                penalty.getDescription()
        );
    }

    private List<AdminInvoicePenaltyItemResponse> buildPenaltyItemsFromBatch(
            BigDecimal invoicePenaltyCharge,
            List<AppliedPenalty> appliedPenalties,
            List<CheckInRecord> checkInRecords
    ) {
        List<AdminInvoicePenaltyItemResponse> items = new java.util.ArrayList<>(
                appliedPenalties.stream()
                        .map(this::toPenaltyItemResponse)
                        .toList()
        );

        checkInRecords.forEach(record -> {
            if (record.getEarlyCheckInFee() != null && record.getEarlyCheckInFee().compareTo(BigDecimal.ZERO) > 0) {
                items.add(new AdminInvoicePenaltyItemResponse(
                        -1000L - record.getId(),
                        "Phí check-in sớm",
                        record.getEarlyCheckInFee(),
                        "Phí phát sinh từ ca lưu trú"
                ));
            }
            if (record.getLateCheckOutFee() != null && record.getLateCheckOutFee().compareTo(BigDecimal.ZERO) > 0) {
                items.add(new AdminInvoicePenaltyItemResponse(
                        -2000L - record.getId(),
                        "Phí check-out trễ",
                        record.getLateCheckOutFee(),
                        "Phí phát sinh từ ca lưu trú"
                ));
            }
        });

        BigDecimal detailTotal = items.stream()
                .map(AdminInvoicePenaltyItemResponse::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal difference = invoicePenaltyCharge.subtract(detailTotal);
        if (difference.compareTo(BigDecimal.ZERO) != 0) {
            items.add(new AdminInvoicePenaltyItemResponse(
                    -1L,
                    "Khoản phạt khác / điều chỉnh",
                    difference,
                    "Khoản chênh lệch giữa hóa đơn và chi tiết phát sinh"
            ));
        }
        return items;
    }
}
