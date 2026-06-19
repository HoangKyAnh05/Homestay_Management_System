package com.homestayManagement.homestayManagement.controller;

import com.homestayManagement.homestayManagement.dto.request.AdminHousekeepingChecklistRequest;
import com.homestayManagement.homestayManagement.dto.response.AdminHousekeepingChecklistTemplateResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminHousekeepingRoomTypeChecklistResponse;
import com.homestayManagement.homestayManagement.service.AdminHousekeepingChecklistService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/housekeeping/checklists")
public class AdminHousekeepingChecklistController {

    private final AdminHousekeepingChecklistService checklistService;

    public AdminHousekeepingChecklistController(AdminHousekeepingChecklistService checklistService) {
        this.checklistService = checklistService;
    }

    @GetMapping
    public List<AdminHousekeepingRoomTypeChecklistResponse> getOverview() {
        return checklistService.getOverview();
    }

    @PutMapping("/room-types/{roomTypeId}")
    public AdminHousekeepingChecklistTemplateResponse saveRoomTypeChecklist(
            @PathVariable Long roomTypeId,
            @Valid @RequestBody AdminHousekeepingChecklistRequest request
    ) {
        return checklistService.saveRoomTypeChecklist(roomTypeId, request);
    }

    @PutMapping("/rooms/{roomId}")
    public AdminHousekeepingChecklistTemplateResponse saveRoomChecklist(
            @PathVariable Long roomId,
            @Valid @RequestBody AdminHousekeepingChecklistRequest request
    ) {
        return checklistService.saveRoomChecklist(roomId, request);
    }

    @DeleteMapping("/rooms/{roomId}")
    public ResponseEntity<Void> resetRoomChecklist(@PathVariable Long roomId) {
        checklistService.resetRoomChecklist(roomId);
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
                .orElse("Dữ liệu checklist không hợp lệ");
        return ResponseEntity.badRequest().body(Map.of("message", message));
    }
}
