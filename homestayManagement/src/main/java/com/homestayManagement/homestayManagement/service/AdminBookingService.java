package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.response.AdminBookingScheduleResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminBookingDetailResponse;
import com.homestayManagement.homestayManagement.dto.request.AdminBookingAddMiniBarRequest;
import com.homestayManagement.homestayManagement.dto.request.AdminBookingAddPenaltyRequest;
import com.homestayManagement.homestayManagement.dto.request.AdminBookingAddServiceRequest;

import java.time.LocalDate;

public interface AdminBookingService {
    AdminBookingScheduleResponse getWeeklySchedule(LocalDate weekStart);
    AdminBookingDetailResponse getBookingDetail(Long bookingDetailId);
    AdminBookingDetailResponse checkIn(Long bookingDetailId);
    AdminBookingDetailResponse checkOut(Long bookingDetailId);
    AdminBookingDetailResponse addService(Long bookingDetailId, AdminBookingAddServiceRequest request);
    AdminBookingDetailResponse addMiniBar(Long bookingDetailId, AdminBookingAddMiniBarRequest request);
    AdminBookingDetailResponse addPenalty(Long bookingDetailId, AdminBookingAddPenaltyRequest request);
    AdminBookingDetailResponse generateInvoice(Long bookingDetailId);
}
