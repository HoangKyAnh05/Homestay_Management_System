package com.homestayManagement.homestayManagement.controller;

import com.homestayManagement.homestayManagement.dto.request.PublicCreateBookingRequest;
import com.homestayManagement.homestayManagement.dto.request.PublicBookingFeedbackRequest;
import com.homestayManagement.homestayManagement.dto.response.PricePolicyResponse;
import com.homestayManagement.homestayManagement.dto.response.PublicBookingHistoryDetailResponse;
import com.homestayManagement.homestayManagement.dto.response.PublicBookingHistoryResponse;
import com.homestayManagement.homestayManagement.dto.response.PublicBookingResponse;
import com.homestayManagement.homestayManagement.dto.response.PublicServiceOptionResponse;
import com.homestayManagement.homestayManagement.service.PublicBookingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

import com.homestayManagement.homestayManagement.dto.request.PublicBookingExtendRequest;
import com.homestayManagement.homestayManagement.dto.request.PublicBookingExtensionCheckRequest;
import com.homestayManagement.homestayManagement.dto.request.PublicBookingCancelRequest;
import com.homestayManagement.homestayManagement.dto.response.PublicBookingCancelPolicyPreviewResponse;
import com.homestayManagement.homestayManagement.dto.response.PublicBookingExtensionCheckResponse;

@RestController
@RequestMapping("/api/bookings")
public class PublicBookingController {

    private final PublicBookingService publicBookingService;

    public PublicBookingController(PublicBookingService publicBookingService) {
        this.publicBookingService = publicBookingService;
    }

    @GetMapping("/price-policies")
    public List<PricePolicyResponse> getPricePolicies() {
        return publicBookingService.getPricePolicies();
    }

    @GetMapping("/services")
    public List<PublicServiceOptionResponse> getServiceOptions() {
        return publicBookingService.getServiceOptions();
    }

    @GetMapping("/my")
    public List<PublicBookingHistoryResponse> getMyBookings(Authentication authentication) {
        return publicBookingService.getMyBookings(authentication.getName());
    }

    @GetMapping("/my/{bookingId}")
    public PublicBookingHistoryDetailResponse getMyBookingDetail(
            Authentication authentication,
            @PathVariable Long bookingId
    ) {
        return publicBookingService.getMyBookingDetail(authentication.getName(), bookingId);
    }

    @PostMapping("/my/{bookingId}/confirm")
    public PublicBookingHistoryDetailResponse confirmMyBooking(
            Authentication authentication,
            @PathVariable Long bookingId
    ) {
        return publicBookingService.confirmMyBooking(authentication.getName(), bookingId);
    }

    @PostMapping("/my/{bookingId}/feedback")
    public PublicBookingHistoryDetailResponse submitMyBookingFeedback(
            Authentication authentication,
            @PathVariable Long bookingId,
            @Valid @RequestBody PublicBookingFeedbackRequest request
    ) {
        return publicBookingService.submitMyBookingFeedback(authentication.getName(), bookingId, request);
    }

    @PostMapping("/my/{bookingId}/check-extension")
    public PublicBookingExtensionCheckResponse checkExtension(
            Authentication authentication,
            @PathVariable Long bookingId,
            @RequestBody PublicBookingExtensionCheckRequest request
    ) {
        return publicBookingService.checkExtension(authentication.getName(), bookingId, request);
    }

    @PostMapping("/my/{bookingId}/extend")
    public PublicBookingHistoryDetailResponse extendStay(
            Authentication authentication,
            @PathVariable Long bookingId,
            @RequestBody PublicBookingExtendRequest request
    ) {
        return publicBookingService.extendStay(authentication.getName(), bookingId, request);
    }

    @GetMapping("/my/{bookingId}/cancel-policy-preview")
    public PublicBookingCancelPolicyPreviewResponse getCancelPolicyPreview(
            Authentication authentication,
            @PathVariable Long bookingId
    ) {
        return publicBookingService.getCancelPolicyPreview(authentication.getName(), bookingId);
    }

    @PostMapping("/my/{bookingId}/cancel")
    public PublicBookingHistoryDetailResponse cancelMyBooking(
            Authentication authentication,
            @PathVariable Long bookingId,
            @Valid @RequestBody PublicBookingCancelRequest request
    ) {
        return publicBookingService.cancelMyBooking(authentication.getName(), bookingId, request);
    }

    @PostMapping
    public PublicBookingResponse createBooking(
            Authentication authentication,
            @Valid @RequestBody PublicCreateBookingRequest request
    ) {
        String authenticatedEmail = authentication != null
                && authentication.isAuthenticated()
                && !(authentication instanceof AnonymousAuthenticationToken)
                ? authentication.getName()
                : null;
        return publicBookingService.createBooking(authenticatedEmail, request);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegal(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(error -> error.getDefaultMessage())
                .orElse("Dữ liệu không hợp lệ");
        return ResponseEntity.badRequest().body(Map.of("message", message));
    }
}
