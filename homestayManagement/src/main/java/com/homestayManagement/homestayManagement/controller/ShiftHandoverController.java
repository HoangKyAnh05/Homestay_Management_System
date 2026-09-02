package com.homestayManagement.homestayManagement.controller;

import com.homestayManagement.homestayManagement.dto.request.ResolveCompensationRequest;
import com.homestayManagement.homestayManagement.dto.request.ShiftHandoverRequest;
import com.homestayManagement.homestayManagement.dto.response.ReceptionistStaffResponse;
import com.homestayManagement.homestayManagement.dto.response.ShiftCurrentStatusResponse;
import com.homestayManagement.homestayManagement.dto.response.ShiftHandoverResponse;
import com.homestayManagement.homestayManagement.service.ShiftHandoverService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/admin/shifts")
@RequiredArgsConstructor
public class ShiftHandoverController {

    private final ShiftHandoverService shiftHandoverService;

    @GetMapping("/current-status")
    public ResponseEntity<ShiftCurrentStatusResponse> getCurrentStatus(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String username = userDetails != null ? userDetails.getUsername() : "";
        return ResponseEntity.ok(shiftHandoverService.getCurrentStatus(username));
    }

    @GetMapping("/receptionists")
    public ResponseEntity<List<ReceptionistStaffResponse>> getReceptionistList(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String username = userDetails != null ? userDetails.getUsername() : "";
        return ResponseEntity.ok(shiftHandoverService.getReceptionistStaffList(username));
    }

    @PostMapping("/handover")
    public ResponseEntity<ShiftHandoverResponse> handoverShift(
            @Valid @RequestBody ShiftHandoverRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String username = userDetails != null ? userDetails.getUsername() : "";
        return ResponseEntity.ok(shiftHandoverService.handoverShift(request, username));
    }

    @GetMapping("/history")
    public ResponseEntity<Page<ShiftHandoverResponse>> getShiftHistory(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String cashStatus,
            @RequestParam(required = false) String compensationStatus,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size
    ) {
        return ResponseEntity.ok(shiftHandoverService.getShiftHistory(
                status,
                cashStatus,
                compensationStatus,
                fromDate,
                toDate,
                PageRequest.of(Math.max(0, page), Math.min(100, Math.max(1, size)))
        ));
    }

    @PutMapping("/{id}/resolve-compensation")
    public ResponseEntity<ShiftHandoverResponse> resolveCompensation(
            @PathVariable Long id,
            @RequestBody(required = false) ResolveCompensationRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String username = userDetails != null ? userDetails.getUsername() : "";
        return ResponseEntity.ok(shiftHandoverService.resolveCompensation(id, request, username));
    }

    @GetMapping("/fund-config")
    public ResponseEntity<com.homestayManagement.homestayManagement.dto.response.FixedFundConfigResponse> getFundConfig() {
        return ResponseEntity.ok(shiftHandoverService.getFixedFundConfig());
    }

    @PostMapping("/fund-config")
    public ResponseEntity<com.homestayManagement.homestayManagement.dto.response.FixedFundConfigResponse> updateFundConfig(
            @Valid @RequestBody com.homestayManagement.homestayManagement.dto.request.FixedFundConfigRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String username = userDetails != null ? userDetails.getUsername() : "";
        return ResponseEntity.ok(shiftHandoverService.updateFixedFundConfig(request, username));
    }
}
