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

    public AdminInvoiceServiceImpl(
            InvoiceRepository invoiceRepository,
            PaymentRepository paymentRepository,
            ServiceUsageRepository serviceUsageRepository,
            RoomAmenitiesUsageRepository roomAmenitiesUsageRepository,
            AppliedPenaltyRepository appliedPenaltyRepository,
            CheckInRecordRepository checkInRecordRepository
    ) {
        this.invoiceRepository = invoiceRepository;
        this.paymentRepository = paymentRepository;
        this.serviceUsageRepository = serviceUsageRepository;
        this.roomAmenitiesUsageRepository = roomAmenitiesUsageRepository;
        this.appliedPenaltyRepository = appliedPenaltyRepository;
        this.checkInRecordRepository = checkInRecordRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminInvoiceResponse> getAllInvoices() {
        return invoiceRepository.findAllForAdmin().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public AdminInvoiceResponse getInvoice(Long id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hóa đơn"));
        return toResponse(invoice);
    }

    private AdminInvoiceResponse toResponse(Invoice invoice) {
        List<Payment> payments = paymentRepository.findByInvoiceIdOrderByPaymentTimeDescIdDesc(invoice.getId());
        List<AdminPaymentResponse> paymentResponses = payments.stream()
                .map(this::toPaymentResponse)
                .toList();
        Long bookingId = invoice.getBooking().getId();
        List<AdminInvoiceServiceItemResponse> serviceItems = buildServiceItems(bookingId, invoice.getServiceCharge());
        List<AdminInvoicePenaltyItemResponse> penaltyItems = buildPenaltyItems(bookingId, invoice.getPenaltyCharge());

        BigDecimal paidAmount = payments.stream()
                .filter(payment -> "SUCCESS".equalsIgnoreCase(payment.getStatus()))
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal remainingAmount = invoice.getTotalAmount().subtract(paidAmount);
        if (remainingAmount.compareTo(BigDecimal.ZERO) < 0) {
            remainingAmount = BigDecimal.ZERO;
        }

        Payment latestPayment = payments.stream()
                .max(Comparator
                        .comparing(Payment::getPaymentTime, Comparator.nullsFirst(Comparator.naturalOrder()))
                        .thenComparing(Payment::getId))
                .orElse(null);

        Customer customer = invoice.getBooking().getCustomer();
        Employee employee = invoice.getEmployee();

        return new AdminInvoiceResponse(
                invoice.getId(),
                invoice.getBooking().getId(),
                invoice.getBooking().getStatus(),
                customer.getId(),
                customer.getFullName(),
                customer.getAccount() != null ? customer.getAccount().getEmail() : null,
                employee != null ? employee.getId() : null,
                employee != null ? employee.getFullName() : "Thanh toan online",
                invoice.getRoomCharge(),
                invoice.getPenaltyCharge(),
                invoice.getServiceCharge(),
                invoice.getTotalAmount(),
                paidAmount,
                remainingAmount,
                latestPayment != null ? latestPayment.getPaymentMethod() : null,
                latestPayment != null ? latestPayment.getStatus() : "PENDING",
                latestPayment != null ? latestPayment.getPaymentTime() : null,
                invoice.getCreatedAt(),
                paymentResponses,
                serviceItems,
                penaltyItems
        );
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

    private List<AdminInvoiceServiceItemResponse> buildServiceItems(Long bookingId, BigDecimal invoiceServiceCharge) {
        List<AdminInvoiceServiceItemResponse> serviceUsages = serviceUsageRepository.findByBookingIdForInvoice(bookingId).stream()
                .map(this::toServiceItemResponse)
                .toList();
        List<AdminInvoiceServiceItemResponse> miniBarUsages = roomAmenitiesUsageRepository.findByBookingIdForInvoice(bookingId).stream()
                .map(this::toMiniBarItemResponse)
                .toList();

        List<AdminInvoiceServiceItemResponse> items = new java.util.ArrayList<>(
                java.util.stream.Stream.concat(serviceUsages.stream(), miniBarUsages.stream()).toList()
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

    private List<AdminInvoicePenaltyItemResponse> buildPenaltyItems(Long bookingId, BigDecimal invoicePenaltyCharge) {
        List<AdminInvoicePenaltyItemResponse> items = new java.util.ArrayList<>(
                appliedPenaltyRepository.findByBookingIdForInvoice(bookingId).stream()
                        .map(this::toPenaltyItemResponse)
                        .toList()
        );

        checkInRecordRepository.findByBookingIdForInvoice(bookingId).forEach(record -> {
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
