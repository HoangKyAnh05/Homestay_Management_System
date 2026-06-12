package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.response.AdminBookingScheduleResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminBookingDetailResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminDirectBookingRoomResponse;
import com.homestayManagement.homestayManagement.dto.request.AdminBookingAddMiniBarRequest;
import com.homestayManagement.homestayManagement.dto.request.AdminBookingAddPenaltyRequest;
import com.homestayManagement.homestayManagement.dto.request.AdminBookingAddServiceRequest;
import com.homestayManagement.homestayManagement.dto.request.AdminDirectBookingRequest;
import com.homestayManagement.homestayManagement.dto.request.AdminUpdateBookingCustomerRequest;
import com.homestayManagement.homestayManagement.dto.request.AdminUpdateBookingDetailRequest;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface AdminBookingService {
    AdminBookingScheduleResponse getWeeklySchedule(LocalDate weekStart);
    AdminBookingDetailResponse getBookingDetail(Long bookingDetailId);
    List<AdminDirectBookingRoomResponse> getDirectBookingRooms(LocalDateTime checkInTarget, LocalDateTime checkOutTarget);
    AdminBookingDetailResponse createDirectBooking(AdminDirectBookingRequest request);
    AdminBookingDetailResponse updateBookingCustomer(Long bookingDetailId, AdminUpdateBookingCustomerRequest request);
    AdminBookingDetailResponse updateBookingDetail(Long bookingDetailId, AdminUpdateBookingDetailRequest request);
    AdminBookingDetailResponse checkIn(Long bookingDetailId);
    AdminBookingDetailResponse checkOut(Long bookingDetailId);
    AdminBookingDetailResponse addService(Long bookingDetailId, AdminBookingAddServiceRequest request);
    AdminBookingDetailResponse addMiniBar(Long bookingDetailId, AdminBookingAddMiniBarRequest request);
    AdminBookingDetailResponse addPenalty(Long bookingDetailId, AdminBookingAddPenaltyRequest request);
    AdminBookingDetailResponse generateInvoice(Long bookingDetailId);
}
