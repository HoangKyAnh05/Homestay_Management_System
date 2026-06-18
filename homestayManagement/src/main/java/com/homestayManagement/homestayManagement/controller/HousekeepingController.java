package com.homestayManagement.homestayManagement.controller;

import com.homestayManagement.homestayManagement.dto.request.HousekeepingInspectionRequest;
import com.homestayManagement.homestayManagement.dto.response.HousekeepingTaskResponse;
import com.homestayManagement.homestayManagement.service.HousekeepingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/housekeeping")
public class HousekeepingController {

    private final HousekeepingService housekeepingService;

    public HousekeepingController(HousekeepingService housekeepingService) {
        this.housekeepingService = housekeepingService;
    }

    @GetMapping("/tasks")
    public List<HousekeepingTaskResponse> getTasks(
            @RequestParam(value = "status", required = false, defaultValue = "ALL") String status
    ) {
        return housekeepingService.getTasks(status);
    }

    @GetMapping("/tasks/{taskId}")
    public HousekeepingTaskResponse getTask(@PathVariable Long taskId) {
        return housekeepingService.getTask(taskId);
    }

    @GetMapping("/booking-details/{bookingDetailId}")
    public HousekeepingTaskResponse getTaskByBookingDetail(@PathVariable Long bookingDetailId) {
        return housekeepingService.getTaskByBookingDetail(bookingDetailId);
    }

    @PostMapping("/booking-details/{bookingDetailId}/request")
    public HousekeepingTaskResponse requestInspection(@PathVariable Long bookingDetailId) {
        return housekeepingService.requestInspection(bookingDetailId);
    }

    @PostMapping("/tasks/{taskId}/start")
    public HousekeepingTaskResponse startTask(@PathVariable Long taskId) {
        return housekeepingService.startTask(taskId);
    }

    @PutMapping("/tasks/{taskId}/inspection")
    public HousekeepingTaskResponse submitInspection(
            @PathVariable Long taskId,
            @Valid @RequestBody HousekeepingInspectionRequest request
    ) {
        return housekeepingService.submitInspection(taskId, request);
    }

    @PostMapping("/tasks/{taskId}/complete-cleaning")
    public HousekeepingTaskResponse completeCleaning(@PathVariable Long taskId) {
        return housekeepingService.completeCleaning(taskId);
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
                .orElse("Dữ liệu housekeeping không hợp lệ");
        return ResponseEntity.badRequest().body(Map.of("message", message));
    }
}
