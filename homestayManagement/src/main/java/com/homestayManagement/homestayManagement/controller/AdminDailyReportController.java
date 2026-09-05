package com.homestayManagement.homestayManagement.controller;

import com.homestayManagement.homestayManagement.dto.dailyreport.DailyReportCreateRequest;
import com.homestayManagement.homestayManagement.dto.dailyreport.DailyReportPreviewResponse;
import com.homestayManagement.homestayManagement.dto.dailyreport.DailyReportResponse;
import com.homestayManagement.homestayManagement.service.DailyClosingReportService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin/daily-reports")
public class AdminDailyReportController {

    private final DailyClosingReportService dailyClosingReportService;

    public AdminDailyReportController(DailyClosingReportService dailyClosingReportService) {
        this.dailyClosingReportService = dailyClosingReportService;
    }

    @GetMapping("/current-preview")
    public ResponseEntity<DailyReportPreviewResponse> getCurrentPreview(
            @RequestParam(value = "date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate date
    ) {
        return ResponseEntity.ok(dailyClosingReportService.getPreview(date));
    }

    @PostMapping
    public ResponseEntity<DailyReportResponse> submitDailyReport(
            @Valid @RequestBody DailyReportCreateRequest request,
            Authentication authentication
    ) {
        String currentUsername = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(dailyClosingReportService.createReport(request, currentUsername));
    }

    @GetMapping
    public ResponseEntity<Page<DailyReportResponse>> getReports(
            @RequestParam(value = "fromDate", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate fromDate,
            @RequestParam(value = "toDate", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate toDate,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(dailyClosingReportService.getReports(fromDate, toDate, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DailyReportResponse> getReportById(@PathVariable Long id) {
        return ResponseEntity.ok(dailyClosingReportService.getReportById(id));
    }

    @PutMapping("/{id}/acknowledge")
    public ResponseEntity<DailyReportResponse> acknowledgeReport(
            @PathVariable Long id,
            Authentication authentication
    ) {
        String adminUsername = authentication != null ? authentication.getName() : "Admin";
        return ResponseEntity.ok(dailyClosingReportService.acknowledgeReport(id, adminUsername));
    }
}
