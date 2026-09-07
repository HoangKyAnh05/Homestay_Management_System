package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.response.SePayPaymentResponse;
import com.homestayManagement.homestayManagement.dto.response.PublicBookingPaymentStatusResponse;

import java.math.BigDecimal;

public interface SePayPaymentService {
    SePayPaymentResponse createPayment(String email, Long bookingId);

    SePayPaymentResponse createPublicBookingPayment(Long bookingId, String email);

    PublicBookingPaymentStatusResponse getPublicBookingPaymentStatus(Long bookingId, String email);

    SePayPaymentResponse createBookingPaymentForAdmin(Long bookingId);

    SePayPaymentResponse createCheckoutPayment(Long bookingId, Long bookingDetailId, BigDecimal amount);

    void handleWebhook(byte[] rawBody, String signature, String timestamp);

    default void handleWebhook(byte[] rawBody, String signature, String timestamp, String authorization) {
        handleWebhook(rawBody, signature, timestamp);
    }
}
