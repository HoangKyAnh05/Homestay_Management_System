package com.homestayManagement.homestayManagement.controller;

import com.homestayManagement.homestayManagement.dto.request.PublicSePayBookingPaymentRequest;
import com.homestayManagement.homestayManagement.dto.response.PublicBookingPaymentStatusResponse;
import com.homestayManagement.homestayManagement.dto.response.SePayPaymentResponse;
import com.homestayManagement.homestayManagement.service.SePayPaymentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments/sepay")
public class SePayPaymentController {

    private final SePayPaymentService sePayPaymentService;

    public SePayPaymentController(SePayPaymentService sePayPaymentService) {
        this.sePayPaymentService = sePayPaymentService;
    }

    @PostMapping("/bookings/{bookingId}")
    public SePayPaymentResponse createPayment(
            Authentication authentication,
            @PathVariable Long bookingId
    ) {
        return sePayPaymentService.createPayment(authentication.getName(), bookingId);
    }

    @PostMapping("/public/bookings/{bookingId}")
    public SePayPaymentResponse createPublicPayment(
            @PathVariable Long bookingId,
            @Valid @RequestBody PublicSePayBookingPaymentRequest request
    ) {
        return sePayPaymentService.createPublicBookingPayment(bookingId, request.email());
    }

    @GetMapping("/public/bookings/{bookingId}/status")
    public PublicBookingPaymentStatusResponse getPublicPaymentStatus(
            @PathVariable Long bookingId,
            @RequestParam String email
    ) {
        return sePayPaymentService.getPublicBookingPaymentStatus(bookingId, email);
    }

    @PostMapping("/webhook")
    public Map<String, Boolean> webhook(
            @RequestBody byte[] rawBody,
            @RequestHeader(name = "X-SePay-Signature", defaultValue = "") String signature,
            @RequestHeader(name = "X-SePay-Timestamp", defaultValue = "") String timestamp
    ) {
        sePayPaymentService.handleWebhook(rawBody, signature, timestamp);
        return Map.of("success", true);
    }

    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    public ResponseEntity<Map<String, String>> handleBadRequest(RuntimeException exception) {
        return ResponseEntity.badRequest().body(Map.of("message", exception.getMessage()));
    }
}
