package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.request.ActivateStayAccountRequest;
import com.homestayManagement.homestayManagement.dto.request.AddBookingFacilityServiceRequest;
import com.homestayManagement.homestayManagement.dto.response.AuthResponse;
import com.homestayManagement.homestayManagement.dto.response.PublicAmenityResponse;
import com.homestayManagement.homestayManagement.dto.response.StayServiceOrderResponse;
import com.homestayManagement.homestayManagement.dto.response.StaySummaryResponse;
import com.homestayManagement.homestayManagement.entity.BookingDetail;
import com.homestayManagement.homestayManagement.entity.CheckInRecord;

import java.util.List;

public interface StayAccessService {

    GrantResult grantAccess(
            BookingDetail bookingDetail,
            CheckInRecord checkInRecord,
            String representativeName,
            String representativeEmail
    );

    void expireAccess(Long bookingDetailId);

    AuthResponse activate(ActivateStayAccountRequest request);

    List<StaySummaryResponse> getCurrentStays(String email);

    List<PublicAmenityResponse> getAvailableServices();

    StayServiceOrderResponse addService(
            String email,
            Long accessId,
            AddBookingFacilityServiceRequest request
    );

    record GrantResult(
            Long accessId,
            String email,
            String status,
            boolean activationRequired,
            boolean emailQueued
    ) {
    }
}
