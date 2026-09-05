package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.dailyreport.DailyReportCreateRequest;
import com.homestayManagement.homestayManagement.dto.dailyreport.DailyReportPreviewResponse;
import com.homestayManagement.homestayManagement.dto.dailyreport.DailyReportResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;

public interface DailyClosingReportService {

    DailyReportPreviewResponse getPreview(LocalDate date);

    DailyReportResponse createReport(DailyReportCreateRequest request, String currentUsername);

    Page<DailyReportResponse> getReports(LocalDate fromDate, LocalDate toDate, Pageable pageable);

    DailyReportResponse getReportById(Long id);

    DailyReportResponse acknowledgeReport(Long id, String adminUsername);
}
