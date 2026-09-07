package com.homestayManagement.homestayManagement.controller;

import com.homestayManagement.homestayManagement.dto.request.PublicSePayBookingPaymentRequest;
import com.homestayManagement.homestayManagement.dto.response.PublicBookingPaymentStatusResponse;
import com.homestayManagement.homestayManagement.dto.response.SePayPaymentResponse;
import com.homestayManagement.homestayManagement.service.SePayPaymentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
@RequestMapping("/api/payments/sepay")
public class SePayPaymentController {

    private static final Logger log = LoggerFactory.getLogger(SePayPaymentController.class);

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
            @RequestBody(required = false) byte[] rawBody,
            @RequestHeader(name = "X-SePay-Signature", defaultValue = "") String signature,
            @RequestHeader(name = "X-SePay-Timestamp", defaultValue = "") String timestamp,
            @RequestHeader(name = "Authorization", defaultValue = "") String authorization
    ) {
        log.info("Received SePay webhook: signature={}, timestamp={}, authPresent={}, bodyLength={}",
                signature, timestamp, !authorization.isBlank(), rawBody != null ? rawBody.length : 0);
        if (rawBody != null && rawBody.length > 0) {
            log.info("SePay webhook payload: {}", new String(rawBody, StandardCharsets.UTF_8));
        }
        sePayPaymentService.handleWebhook(rawBody, signature, timestamp, authorization);
        log.info("SePay webhook processed successfully");
        return Map.of("success", true);
    }

    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    public ResponseEntity<Map<String, String>> handleBadRequest(RuntimeException exception) {
        log.warn("SePay webhook error: {}", exception.getMessage(), exception);
        return ResponseEntity.badRequest().body(Map.of("message", exception.getMessage()));
    }
}
