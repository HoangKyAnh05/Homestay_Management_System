package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.response.AdminHousekeepingCalendarResponse;

import java.time.LocalDate;

public interface AdminHousekeepingCalendarService {
    AdminHousekeepingCalendarResponse getCalendar(LocalDate startDate, int days, Long roomTypeId);
}
