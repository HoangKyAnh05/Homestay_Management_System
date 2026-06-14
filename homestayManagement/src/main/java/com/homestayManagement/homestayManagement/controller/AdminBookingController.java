package com.homestayManagement.homestayManagement.controller;

import com.homestayManagement.homestayManagement.dto.request.AdminBookingAddMiniBarRequest;
import com.homestayManagement.homestayManagement.dto.request.AdminBookingAddPenaltyRequest;
import com.homestayManagement.homestayManagement.dto.request.AdminBookingAddServiceRequest;
import com.homestayManagement.homestayManagement.dto.request.AdminDirectBookingRequest;
import com.homestayManagement.homestayManagement.dto.request.AdminUpdateBookingCustomerRequest;
import com.homestayManagement.homestayManagement.dto.request.AdminUpdateBookingDetailRequest;
import com.homestayManagement.homestayManagement.dto.response.AdminBookingDetailResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminCheckoutResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminBookingScheduleResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminCheckInLogBookingResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminDirectBookingRoomResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminDirectBookingResponse;
import com.homestayManagement.homestayManagement.service.AdminBookingService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
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

    @GetMapping("/check-in-logs")
    public List<AdminCheckInLogBookingResponse> getCheckInLogs(
            @RequestParam(value = "fromDate", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate fromDate,
            @RequestParam(value = "toDate", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate toDate
    ) {
        return adminBookingService.getCheckInLogs(fromDate, toDate);
    }

    @GetMapping("/details/{bookingDetailId}")
    public AdminBookingDetailResponse getBookingDetail(@PathVariable Long bookingDetailId) {
        return adminBookingService.getBookingDetail(bookingDetailId);
    }

    @GetMapping("/direct/rooms")
    public List<AdminDirectBookingRoomResponse> getDirectBookingRooms(
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime checkInTarget,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime checkOutTarget
    ) {
        return adminBookingService.getDirectBookingRooms(checkInTarget, checkOutTarget);
    }

    @PostMapping("/direct")
    public AdminDirectBookingResponse createDirectBooking(@Valid @RequestBody AdminDirectBookingRequest request) {
        return adminBookingService.createDirectBooking(request);
    }

    @PutMapping("/details/{bookingDetailId}/customer")
    public AdminBookingDetailResponse updateBookingCustomer(
            @PathVariable Long bookingDetailId,
            @Valid @RequestBody AdminUpdateBookingCustomerRequest request
    ) {
        return adminBookingService.updateBookingCustomer(bookingDetailId, request);
    }

    @PutMapping("/details/{bookingDetailId}/booking-info")
    public AdminBookingDetailResponse updateBookingDetail(
            @PathVariable Long bookingDetailId,
            @Valid @RequestBody AdminUpdateBookingDetailRequest request
    ) {
        return adminBookingService.updateBookingDetail(bookingDetailId, request);
    }

    @PostMapping("/details/{bookingDetailId}/check-in")
    public AdminBookingDetailResponse checkIn(@PathVariable Long bookingDetailId) {
        return adminBookingService.checkIn(bookingDetailId);
    }

    @PostMapping("/details/{bookingDetailId}/check-out")
    public AdminBookingDetailResponse checkOut(@PathVariable Long bookingDetailId) {
        return adminBookingService.checkOut(bookingDetailId);
    }

    @PostMapping("/details/{bookingDetailId}/prepare-check-out")
    public AdminCheckoutResponse prepareCheckOut(@PathVariable Long bookingDetailId) {
        return adminBookingService.prepareCheckOut(bookingDetailId);
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
