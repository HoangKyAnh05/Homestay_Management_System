package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.request.AddBookingFacilityServiceRequest;
import com.homestayManagement.homestayManagement.dto.response.AddedBookingServiceResponse;
import com.homestayManagement.homestayManagement.dto.response.EligibleServiceBookingResponse;
import com.homestayManagement.homestayManagement.dto.response.PublicAmenityResponse;

import java.util.List;

public interface PublicAmenityService {
    List<PublicAmenityResponse> getActiveAmenities();
    List<EligibleServiceBookingResponse> getEligibleBookings(String email);
    AddedBookingServiceResponse addServiceToBooking(String email, Long bookingId, AddBookingFacilityServiceRequest request);
}
