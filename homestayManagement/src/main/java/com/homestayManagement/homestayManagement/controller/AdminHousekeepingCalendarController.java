package com.homestayManagement.homestayManagement.controller;

import com.homestayManagement.homestayManagement.dto.response.AdminHousekeepingCalendarResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminHousekeepingCleaningTraceResponse;
import com.homestayManagement.homestayManagement.service.AdminHousekeepingCalendarService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/housekeeping/calendar")
public class AdminHousekeepingCalendarController {

    private final AdminHousekeepingCalendarService calendarService;

    public AdminHousekeepingCalendarController(AdminHousekeepingCalendarService calendarService) {
        this.calendarService = calendarService;
    }

    @GetMapping
    public AdminHousekeepingCalendarResponse getCalendar(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(defaultValue = "7") int days,
            @RequestParam(required = false) Long roomTypeId
    ) {
        return calendarService.getCalendar(startDate, days, roomTypeId);
    }

    @GetMapping("/rooms/{roomId}/latest-cleaning")
    public AdminHousekeepingCleaningTraceResponse getLatestCleaning(
            @PathVariable Long roomId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime completedBefore
    ) {
        return calendarService.getLatestCleaningTrace(roomId, completedBefore);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegal(IllegalArgumentException exception) {
        return ResponseEntity.badRequest().body(Map.of("message", exception.getMessage()));
    }
}
