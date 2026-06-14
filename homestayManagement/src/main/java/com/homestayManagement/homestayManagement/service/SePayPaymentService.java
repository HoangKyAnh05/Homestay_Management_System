package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.response.SePayPaymentResponse;

import java.math.BigDecimal;

public interface SePayPaymentService {
    SePayPaymentResponse createPayment(String email, Long bookingId);

    SePayPaymentResponse createBookingPaymentForAdmin(Long bookingId);

    SePayPaymentResponse createCheckoutPayment(Long bookingId, BigDecimal amount);

    void handleWebhook(byte[] rawBody, String signature, String timestamp);
}
