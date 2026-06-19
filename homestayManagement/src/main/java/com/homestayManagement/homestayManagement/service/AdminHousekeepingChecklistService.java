package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.request.AdminHousekeepingChecklistRequest;
import com.homestayManagement.homestayManagement.dto.response.AdminHousekeepingChecklistTemplateResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminHousekeepingRoomTypeChecklistResponse;

import java.util.List;

public interface AdminHousekeepingChecklistService {
    List<AdminHousekeepingRoomTypeChecklistResponse> getOverview();
    AdminHousekeepingChecklistTemplateResponse saveRoomTypeChecklist(Long roomTypeId, AdminHousekeepingChecklistRequest request);
    AdminHousekeepingChecklistTemplateResponse saveRoomChecklist(Long roomId, AdminHousekeepingChecklistRequest request);
    void resetRoomChecklist(Long roomId);
}
