package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.request.PublicCreateBookingRequest;
import com.homestayManagement.homestayManagement.dto.response.PricePolicyResponse;
import com.homestayManagement.homestayManagement.dto.response.PublicBookingHistoryDetailResponse;
import com.homestayManagement.homestayManagement.dto.response.PublicBookingHistoryResponse;
import com.homestayManagement.homestayManagement.dto.response.PublicBookingResponse;
import com.homestayManagement.homestayManagement.dto.response.PublicServiceOptionResponse;

import java.util.List;

public interface PublicBookingService {
    List<PricePolicyResponse> getPricePolicies();
    List<PublicServiceOptionResponse> getServiceOptions();
    List<PublicBookingHistoryResponse> getMyBookings(String email);
    PublicBookingHistoryDetailResponse getMyBookingDetail(String email, Long bookingId);
    PublicBookingResponse createBooking(String email, PublicCreateBookingRequest request);
}
