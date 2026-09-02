package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.request.PublicCreateBookingRequest;
import com.homestayManagement.homestayManagement.dto.request.PublicBookingFeedbackRequest;
import com.homestayManagement.homestayManagement.dto.request.PublicBookingExtendRequest;
import com.homestayManagement.homestayManagement.dto.request.PublicBookingExtensionCheckRequest;
import com.homestayManagement.homestayManagement.dto.response.PricePolicyResponse;
import com.homestayManagement.homestayManagement.dto.response.PublicBookingExtensionCheckResponse;
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
    PublicBookingHistoryDetailResponse confirmMyBooking(String email, Long bookingId);
    PublicBookingHistoryDetailResponse submitMyBookingFeedback(String email, Long bookingId, PublicBookingFeedbackRequest request);
    PublicBookingResponse createBooking(String authenticatedEmail, PublicCreateBookingRequest request);
    PublicBookingExtensionCheckResponse checkExtension(String email, Long bookingId, PublicBookingExtensionCheckRequest request);
    PublicBookingHistoryDetailResponse extendStay(String email, Long bookingId, PublicBookingExtendRequest request);
    com.homestayManagement.homestayManagement.dto.response.PublicBookingCancelPolicyPreviewResponse getCancelPolicyPreview(String email, Long bookingId);
    PublicBookingHistoryDetailResponse cancelMyBooking(String email, Long bookingId, com.homestayManagement.homestayManagement.dto.request.PublicBookingCancelRequest request);
}
