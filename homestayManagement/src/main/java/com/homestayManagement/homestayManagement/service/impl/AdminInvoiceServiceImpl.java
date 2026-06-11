package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.response.AdminInvoiceResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminPaymentResponse;
import com.homestayManagement.homestayManagement.entity.Customer;
import com.homestayManagement.homestayManagement.entity.Employee;
import com.homestayManagement.homestayManagement.entity.Invoice;
import com.homestayManagement.homestayManagement.entity.Payment;
import com.homestayManagement.homestayManagement.repository.InvoiceRepository;
import com.homestayManagement.homestayManagement.repository.PaymentRepository;
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

    public AdminInvoiceServiceImpl(InvoiceRepository invoiceRepository, PaymentRepository paymentRepository) {
        this.invoiceRepository = invoiceRepository;
        this.paymentRepository = paymentRepository;
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
                employee.getId(),
                employee.getFullName(),
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
                paymentResponses
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
}
