package com.homestayManagement.homestayManagement.controller;

import com.homestayManagement.homestayManagement.dto.request.RoomIncidentCompensationRequest;
import com.homestayManagement.homestayManagement.dto.request.RoomIncidentCreateRequest;
import com.homestayManagement.homestayManagement.dto.request.RoomIncidentStatusUpdateRequest;
import com.homestayManagement.homestayManagement.dto.response.RoomIncidentResponse;
import com.homestayManagement.homestayManagement.dto.response.RoomIncidentSummaryResponse;
import com.homestayManagement.homestayManagement.service.RoomIncidentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/incidents")
public class RoomIncidentController {

    private final RoomIncidentService roomIncidentService;

    public RoomIncidentController(RoomIncidentService roomIncidentService) {
        this.roomIncidentService = roomIncidentService;
    }

    @PostMapping("/upload-image")
    public ResponseEntity<Map<String, String>> uploadEvidenceImage(
            @RequestParam("file") MultipartFile file
    ) throws IOException {
        String url = roomIncidentService.uploadEvidenceImage(file);
        return ResponseEntity.ok(Map.of("url", url));
    }

    @GetMapping
    public List<RoomIncidentResponse> getIncidents(
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "roomId", required = false) Long roomId
    ) {
        return roomIncidentService.getIncidents(status, type, roomId);
    }

    @GetMapping("/summary")
    public RoomIncidentSummaryResponse getIncidentSummary() {
        return roomIncidentService.getIncidentSummary();
    }

    @GetMapping("/{id}")
    public RoomIncidentResponse getIncident(@PathVariable Long id) {
        return roomIncidentService.getIncident(id);
    }

    @PostMapping
    public ResponseEntity<RoomIncidentResponse> reportIncident(
            @Valid @RequestBody RoomIncidentCreateRequest request
    ) {
        return ResponseEntity.ok(roomIncidentService.reportIncident(request));
    }

    @PutMapping("/{id}/status")
    public RoomIncidentResponse updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody RoomIncidentStatusUpdateRequest request
    ) {
        return roomIncidentService.updateStatus(id, request);
    }

    @PutMapping("/{id}/compensation")
    public RoomIncidentResponse decideCompensation(
            @PathVariable Long id,
            @Valid @RequestBody RoomIncidentCompensationRequest request
    ) {
        return roomIncidentService.decideCompensation(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteIncident(@PathVariable Long id) {
        roomIncidentService.deleteIncident(id);
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegal(IllegalArgumentException exception) {
        return ResponseEntity.badRequest().body(Map.of("message", exception.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(error -> error.getDefaultMessage())
                .orElse("Dữ liệu sự cố không hợp lệ");
        return ResponseEntity.badRequest().body(Map.of("message", message));
    }
}
