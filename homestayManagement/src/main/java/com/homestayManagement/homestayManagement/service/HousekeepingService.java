package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.request.HousekeepingInspectionRequest;
import com.homestayManagement.homestayManagement.dto.request.HousekeepingCleaningCompletionRequest;
import com.homestayManagement.homestayManagement.dto.response.HousekeepingTaskResponse;

import java.util.List;

public interface HousekeepingService {
    List<HousekeepingTaskResponse> getTasks(String status);
    HousekeepingTaskResponse getTask(Long taskId);
    HousekeepingTaskResponse getTaskByBookingDetail(Long bookingDetailId);
    HousekeepingTaskResponse requestInspection(Long bookingDetailId);
    HousekeepingTaskResponse startTask(Long taskId);
    HousekeepingTaskResponse submitInspection(Long taskId, HousekeepingInspectionRequest request);
    HousekeepingTaskResponse completeCleaning(Long taskId, HousekeepingCleaningCompletionRequest request);
}
