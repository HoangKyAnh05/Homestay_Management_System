package com.homestayManagement.homestayManagement.controller;

import com.homestayManagement.homestayManagement.dto.request.PublicCreateBookingRequest;
import com.homestayManagement.homestayManagement.dto.response.PricePolicyResponse;
import com.homestayManagement.homestayManagement.dto.response.PublicBookingHistoryDetailResponse;
import com.homestayManagement.homestayManagement.dto.response.PublicBookingHistoryResponse;
import com.homestayManagement.homestayManagement.dto.response.PublicBookingResponse;
import com.homestayManagement.homestayManagement.dto.response.PublicServiceOptionResponse;
import com.homestayManagement.homestayManagement.service.PublicBookingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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

    @PostMapping
    public PublicBookingResponse createBooking(
            Authentication authentication,
            @Valid @RequestBody PublicCreateBookingRequest request
    ) {
        return publicBookingService.createBooking(authentication.getName(), request);
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
