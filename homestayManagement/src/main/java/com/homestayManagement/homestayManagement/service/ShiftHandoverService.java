package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.request.ResolveCompensationRequest;
import com.homestayManagement.homestayManagement.dto.request.ShiftHandoverRequest;
import com.homestayManagement.homestayManagement.dto.response.ReceptionistStaffResponse;
import com.homestayManagement.homestayManagement.dto.response.ShiftCurrentStatusResponse;
import com.homestayManagement.homestayManagement.dto.response.ShiftHandoverResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;

public interface ShiftHandoverService {

    ShiftCurrentStatusResponse getCurrentStatus(String currentUsername);

    List<ReceptionistStaffResponse> getReceptionistStaffList(String currentUsername);

    ShiftHandoverResponse handoverShift(ShiftHandoverRequest request, String currentUsername);

    Page<ShiftHandoverResponse> getShiftHistory(
            String status,
            String cashStatus,
            String compensationStatus,
            LocalDateTime fromDate,
            LocalDateTime toDate,
            Pageable pageable
    );

    ShiftHandoverResponse resolveCompensation(Long id, ResolveCompensationRequest request, String currentUsername);

    com.homestayManagement.homestayManagement.dto.response.FixedFundConfigResponse getFixedFundConfig();

    com.homestayManagement.homestayManagement.dto.response.FixedFundConfigResponse updateFixedFundConfig(
            com.homestayManagement.homestayManagement.dto.request.FixedFundConfigRequest request,
            String currentUsername
    );
}
