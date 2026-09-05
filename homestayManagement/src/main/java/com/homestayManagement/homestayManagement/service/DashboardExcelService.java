package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.response.WeeklyReportFileResponse;

import java.time.LocalDate;
import java.util.List;

public interface DashboardExcelService {

    byte[] generateDashboardExcel(LocalDate fromDate, LocalDate toDate);

    String generateAndSaveWeeklyReport();

    List<WeeklyReportFileResponse> getWeeklyReports();

    byte[] getWeeklyReportContent(String fileName);
}
