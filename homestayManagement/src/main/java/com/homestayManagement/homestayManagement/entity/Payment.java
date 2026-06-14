package com.homestayManagement.homestayManagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    private Invoice invoice;

    // CASH, VNPAY, MOMO, BANK_TRANSFER
    @Column(name = "payment_method", nullable = false, length = 20)
    private String paymentMethod;

    @Column(name = "transaction_no", length = 100)
    private String transactionNo; // Mã giao dịch từ VNPay/MoMo trả về

    @Column(name = "payment_code", unique = true, length = 30)
    private String paymentCode;

    @Column(name = "sepay_transaction_id", unique = true)
    private Long sepayTransactionId;

    @Column(name = "qr_code_url", length = 1000)
    private String qrCodeUrl;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    // PENDING, SUCCESS, FAILED
    @Builder.Default
    @Column(nullable = false, length = 20)
    private String status = "PENDING";

    @Column(name = "payment_time")
    private LocalDateTime paymentTime;
}
