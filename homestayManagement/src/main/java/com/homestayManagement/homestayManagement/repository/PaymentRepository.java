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
}
