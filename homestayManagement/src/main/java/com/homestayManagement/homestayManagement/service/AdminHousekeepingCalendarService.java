package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.response.AdminHousekeepingCalendarResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminHousekeepingCleaningTraceResponse;

import java.time.LocalDate;
import java.time.LocalDateTime;

public interface AdminHousekeepingCalendarService {
    AdminHousekeepingCalendarResponse getCalendar(LocalDate startDate, int days, Long roomTypeId);
    AdminHousekeepingCleaningTraceResponse getLatestCleaningTrace(Long roomId, LocalDateTime completedBefore);
}
