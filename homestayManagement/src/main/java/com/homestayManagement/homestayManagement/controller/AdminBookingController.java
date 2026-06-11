package com.homestayManagement.homestayManagement.controller;

import com.homestayManagement.homestayManagement.dto.response.AdminBookingDetailResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminBookingScheduleResponse;
import com.homestayManagement.homestayManagement.service.AdminBookingService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
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

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegal(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    }
}
