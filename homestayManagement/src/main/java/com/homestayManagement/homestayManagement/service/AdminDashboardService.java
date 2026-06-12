package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.response.AdminDashboardSummaryResponse;

import java.time.LocalDate;

public interface AdminDashboardService {
    AdminDashboardSummaryResponse getSummary(LocalDate fromDate, LocalDate toDate);
}
