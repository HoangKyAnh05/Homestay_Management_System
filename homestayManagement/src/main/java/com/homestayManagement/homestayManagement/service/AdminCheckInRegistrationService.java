package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.request.AdminCompleteCheckInRequest;
import com.homestayManagement.homestayManagement.dto.response.AdminCheckInPreparationResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminCompleteCheckInResponse;

public interface AdminCheckInRegistrationService {
    AdminCheckInPreparationResponse prepare(Long bookingDetailId);
    AdminCompleteCheckInResponse complete(Long bookingDetailId, AdminCompleteCheckInRequest request);
}
