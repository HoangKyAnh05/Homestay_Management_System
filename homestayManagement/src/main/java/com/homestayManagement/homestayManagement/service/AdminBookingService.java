package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.response.AdminBookingScheduleResponse;

import java.time.LocalDate;

public interface AdminBookingService {
    AdminBookingScheduleResponse getWeeklySchedule(LocalDate weekStart);
}
