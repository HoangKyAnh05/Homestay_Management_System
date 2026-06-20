package com.homestayManagement.homestayManagement.controller;

import com.homestayManagement.homestayManagement.dto.request.AddBookingFacilityServiceRequest;
import com.homestayManagement.homestayManagement.dto.response.AddedBookingServiceResponse;
import com.homestayManagement.homestayManagement.dto.response.EligibleServiceBookingResponse;
import com.homestayManagement.homestayManagement.dto.response.PublicAmenityResponse;
import com.homestayManagement.homestayManagement.service.PublicAmenityService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/amenities")
public class PublicAmenityController {

    private final PublicAmenityService publicAmenityService;

    public PublicAmenityController(PublicAmenityService publicAmenityService) {
        this.publicAmenityService = publicAmenityService;
    }

    @GetMapping
    public List<PublicAmenityResponse> getActiveAmenities() {
        return publicAmenityService.getActiveAmenities();
    }

    @GetMapping("/eligible-bookings")
    public List<EligibleServiceBookingResponse> getEligibleBookings(Authentication authentication) {
        return publicAmenityService.getEligibleBookings(authentication.getName());
    }

    @PostMapping("/bookings/{bookingId}/services")
    public AddedBookingServiceResponse addService(
            Authentication authentication,
            @PathVariable Long bookingId,
            @Valid @RequestBody AddBookingFacilityServiceRequest request
    ) {
        return publicAmenityService.addServiceToBooking(authentication.getName(), bookingId, request);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegal(IllegalArgumentException exception) {
        return ResponseEntity.badRequest().body(Map.of("message", exception.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult().getFieldErrors().stream()
                .findFirst().map(error -> error.getDefaultMessage()).orElse("Dữ liệu không hợp lệ");
        return ResponseEntity.badRequest().body(Map.of("message", message));
    }
}
