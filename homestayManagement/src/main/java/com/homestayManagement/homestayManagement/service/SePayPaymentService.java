package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.response.SePayPaymentResponse;

public interface SePayPaymentService {
    SePayPaymentResponse createPayment(String email, Long bookingId);

    void handleWebhook(byte[] rawBody, String signature, String timestamp);
}
