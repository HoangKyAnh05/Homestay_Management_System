package com.homestayManagement.homestayManagement.controller;

import com.homestayManagement.homestayManagement.dto.request.AdminBookingAddMiniBarRequest;
import com.homestayManagement.homestayManagement.dto.request.AdminBookingAddPenaltyRequest;
import com.homestayManagement.homestayManagement.dto.request.AdminBookingAddServiceRequest;
import com.homestayManagement.homestayManagement.dto.response.AdminBookingDetailResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminBookingScheduleResponse;
import com.homestayManagement.homestayManagement.service.AdminBookingService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/bookings")
public class AdminBookingController {

    private final AdminBookingService adminBookingService;

    public AdminBookingController(AdminBookingService adminBookingService) {
        this.adminBookingService = adminBookingService;
    }

    @GetMapping("/schedule")
    public AdminBookingScheduleResponse getWeeklySchedule(
            @RequestParam(value = "weekStart", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate weekStart
    ) {
        return adminBookingService.getWeeklySchedule(weekStart);
    }

    @GetMapping("/details/{bookingDetailId}")
    public AdminBookingDetailResponse getBookingDetail(@PathVariable Long bookingDetailId) {
        return adminBookingService.getBookingDetail(bookingDetailId);
    }

    @PostMapping("/details/{bookingDetailId}/check-in")
    public AdminBookingDetailResponse checkIn(@PathVariable Long bookingDetailId) {
        return adminBookingService.checkIn(bookingDetailId);
    }

    @PostMapping("/details/{bookingDetailId}/check-out")
    public AdminBookingDetailResponse checkOut(@PathVariable Long bookingDetailId) {
        return adminBookingService.checkOut(bookingDetailId);
    }

    @PostMapping("/details/{bookingDetailId}/services")
    public AdminBookingDetailResponse addService(
            @PathVariable Long bookingDetailId,
            @Valid @RequestBody AdminBookingAddServiceRequest request
    ) {
        return adminBookingService.addService(bookingDetailId, request);
    }

    @PostMapping("/details/{bookingDetailId}/mini-bar")
    public AdminBookingDetailResponse addMiniBar(
            @PathVariable Long bookingDetailId,
            @Valid @RequestBody AdminBookingAddMiniBarRequest request
    ) {
        return adminBookingService.addMiniBar(bookingDetailId, request);
    }

    @PostMapping("/details/{bookingDetailId}/penalties")
    public AdminBookingDetailResponse addPenalty(
            @PathVariable Long bookingDetailId,
            @Valid @RequestBody AdminBookingAddPenaltyRequest request
    ) {
        return adminBookingService.addPenalty(bookingDetailId, request);
    }

    @PostMapping("/details/{bookingDetailId}/invoice")
    public AdminBookingDetailResponse generateInvoice(@PathVariable Long bookingDetailId) {
        return adminBookingService.generateInvoice(bookingDetailId);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegal(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException e) {
        String msg = e.getBindingResult().getFieldErrors().stream()
                .findFirst().map(err -> err.getDefaultMessage()).orElse("Dữ liệu không hợp lệ");
        return ResponseEntity.badRequest().body(Map.of("message", msg));
    }
}
