package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByInvoiceIdOrderByPaymentTimeDescIdDesc(Long invoiceId);
}
