package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByInvoiceIdOrderByPaymentTimeDescIdDesc(Long invoiceId);
    Optional<Payment> findByPaymentCodeIgnoreCase(String paymentCode);
    Optional<Payment> findBySepayTransactionId(Long sepayTransactionId);
    Optional<Payment> findFirstByInvoiceIdAndPaymentMethodAndStatusOrderByIdDesc(
            Long invoiceId,
            String paymentMethod,
            String status
    );
    Optional<Payment> findFirstByInvoiceIdAndPaymentMethodAndPaymentPurposeAndStatusOrderByIdDesc(
            Long invoiceId,
            String paymentMethod,
            String paymentPurpose,
            String status
    );
    Optional<Payment> findFirstByInvoiceIdAndBookingDetailIdAndPaymentMethodAndPaymentPurposeAndStatusOrderByIdDesc(
            Long invoiceId,
            Long bookingDetailId,
            String paymentMethod,
            String paymentPurpose,
            String status
    );

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE " +
            "p.paymentMethod = 'CASH' AND p.status = 'SUCCESS' AND " +
            "(:fromTime IS NULL OR p.paymentTime >= :fromTime) AND " +
            "(:toTime IS NULL OR p.paymentTime <= :toTime)")
    java.math.BigDecimal sumCashPaymentsBetween(
            @org.springframework.data.repository.query.Param("fromTime") java.time.LocalDateTime fromTime,
            @org.springframework.data.repository.query.Param("toTime") java.time.LocalDateTime toTime
    );
}
