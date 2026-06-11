package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.response.AdminBookingScheduleResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminBookingDetailResponse;

import java.time.LocalDate;

public interface AdminBookingService {
    AdminBookingScheduleResponse getWeeklySchedule(LocalDate weekStart);
    AdminBookingDetailResponse getBookingDetail(Long bookingDetailId);
}
