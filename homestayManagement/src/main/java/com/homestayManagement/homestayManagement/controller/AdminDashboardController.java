package com.homestayManagement.homestayManagement.controller;

import com.homestayManagement.homestayManagement.dto.response.AdminDashboardSummaryResponse;
import com.homestayManagement.homestayManagement.dto.response.WeeklyReportFileResponse;
import com.homestayManagement.homestayManagement.service.AdminDashboardService;
import com.homestayManagement.homestayManagement.service.DashboardExcelService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/dashboard")
public class AdminDashboardController {

    private static final String EXCEL_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    private final AdminDashboardService adminDashboardService;
    private final DashboardExcelService dashboardExcelService;

    public AdminDashboardController(
            AdminDashboardService adminDashboardService,
            DashboardExcelService dashboardExcelService
    ) {
        this.adminDashboardService = adminDashboardService;
        this.dashboardExcelService = dashboardExcelService;
    }

    @GetMapping("/summary")
    public AdminDashboardSummaryResponse getSummary(
            @RequestParam(value = "fromDate", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate fromDate,
            @RequestParam(value = "toDate", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate toDate
    ) {
        return adminDashboardService.getSummary(fromDate, toDate);
    }

    @GetMapping("/export-excel")
    public ResponseEntity<byte[]> exportExcel(
            @RequestParam(value = "fromDate", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate fromDate,
            @RequestParam(value = "toDate", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate toDate
    ) {
        LocalDate start = fromDate != null ? fromDate : LocalDate.now().minusMonths(1);
        LocalDate end = toDate != null ? toDate : LocalDate.now();

        byte[] excelData = dashboardExcelService.generateDashboardExcel(start, end);

        String fileName = String.format("Bao_Cao_Tong_Quan_%s_Den_%s.xlsx",
                start.format(DateTimeFormatter.BASIC_ISO_DATE),
                end.format(DateTimeFormatter.BASIC_ISO_DATE));
        String encodedFileName = URLEncoder.encode(fileName, StandardCharsets.UTF_8).replace("+", "%20");

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"; filename*=UTF-8''" + encodedFileName)
                .contentType(MediaType.parseMediaType(EXCEL_CONTENT_TYPE))
                .body(excelData);
    }

    @GetMapping("/weekly-reports")
    public List<WeeklyReportFileResponse> getWeeklyReports() {
        return dashboardExcelService.getWeeklyReports();
    }

    @GetMapping({"/weekly-reports/download", "/weekly-reports/{fileName:.+}"})
    public ResponseEntity<byte[]> downloadWeeklyReport(
            @PathVariable(required = false) String fileName,
            @RequestParam(value = "file", required = false) String queryFileName
    ) {
        String targetName = queryFileName != null && !queryFileName.isBlank() ? queryFileName : fileName;
        byte[] content = dashboardExcelService.getWeeklyReportContent(targetName);
        String encodedFileName = URLEncoder.encode(targetName, StandardCharsets.UTF_8).replace("+", "%20");

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + targetName + "\"; filename*=UTF-8''" + encodedFileName)
                .contentType(MediaType.parseMediaType(EXCEL_CONTENT_TYPE))
                .body(content);
    }

    @PostMapping("/weekly-reports/generate-now")
    public ResponseEntity<Map<String, String>> generateWeeklyReportNow() {
        String fileName = dashboardExcelService.generateAndSaveWeeklyReport();
        return ResponseEntity.ok(Map.of(
                "fileName", fileName,
                "message", "Đã tạo báo cáo tuần thành công!"
        ));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegal(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    }
}
