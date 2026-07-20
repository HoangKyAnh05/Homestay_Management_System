package com.homestayManagement.homestayManagement.controller;

import com.homestayManagement.homestayManagement.dto.request.AddBookingFacilityServiceRequest;
import com.homestayManagement.homestayManagement.dto.response.PublicAmenityResponse;
import com.homestayManagement.homestayManagement.dto.response.StayServiceOrderResponse;
import com.homestayManagement.homestayManagement.dto.response.StaySummaryResponse;
import com.homestayManagement.homestayManagement.service.StayAccessService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stays")
public class StayPortalController {

    private final StayAccessService stayAccessService;

    public StayPortalController(StayAccessService stayAccessService) {
        this.stayAccessService = stayAccessService;
    }

    @GetMapping("/current")
    public List<StaySummaryResponse> getCurrentStays(Authentication authentication) {
        return stayAccessService.getCurrentStays(authentication.getName());
    }

    @GetMapping("/services")
    public List<PublicAmenityResponse> getAvailableServices() {
        return stayAccessService.getAvailableServices();
    }

    @PostMapping("/{accessId}/services")
    public StayServiceOrderResponse addService(
            Authentication authentication,
            @PathVariable Long accessId,
            @Valid @RequestBody AddBookingFacilityServiceRequest request
    ) {
        return stayAccessService.addService(authentication.getName(), accessId, request);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException exception) {
        return ResponseEntity.badRequest().body(Map.of("message", exception.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(error -> error.getDefaultMessage())
                .orElse("Dữ liệu không hợp lệ");
        return ResponseEntity.badRequest().body(Map.of("message", message));
    }
}
