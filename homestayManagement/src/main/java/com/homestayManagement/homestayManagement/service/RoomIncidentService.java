package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.request.RoomIncidentCompensationRequest;
import com.homestayManagement.homestayManagement.dto.request.RoomIncidentCreateRequest;
import com.homestayManagement.homestayManagement.dto.request.RoomIncidentStatusUpdateRequest;
import com.homestayManagement.homestayManagement.dto.response.RoomIncidentResponse;
import com.homestayManagement.homestayManagement.dto.response.RoomIncidentSummaryResponse;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

public interface RoomIncidentService {

    List<RoomIncidentResponse> getIncidents(String status, String type, Long roomId);

    RoomIncidentResponse getIncident(Long id);

    RoomIncidentSummaryResponse getIncidentSummary();

    RoomIncidentResponse reportIncident(RoomIncidentCreateRequest request);

    RoomIncidentResponse updateStatus(Long id, RoomIncidentStatusUpdateRequest request);

    RoomIncidentResponse decideCompensation(Long id, RoomIncidentCompensationRequest request);

    void deleteIncident(Long id);

    String uploadEvidenceImage(MultipartFile file) throws IOException;
}
