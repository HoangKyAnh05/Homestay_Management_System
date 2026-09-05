package com.homestayManagement.homestayManagement.controller;

import com.homestayManagement.homestayManagement.dto.giveaway.*;
import com.homestayManagement.homestayManagement.service.GiveawayService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/marketing/giveaway")
public class AdminGiveawayController {

    private final GiveawayService giveawayService;

    public AdminGiveawayController(GiveawayService giveawayService) {
        this.giveawayService = giveawayService;
    }

    @GetMapping("/stats")
    public GiveawayStatsResponse getStats() {
        return giveawayService.getStats();
    }

    @GetMapping("/leads")
    public Page<GiveawayLeadResponse> getLeads(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return giveawayService.getLeads(search, status, pageable);
    }

    @PatchMapping("/leads/{id}/status")
    public GiveawayLeadResponse updateLeadStatus(
            @PathVariable Long id,
            @Valid @RequestBody GiveawayLeadUpdateStatusRequest request
    ) {
        return giveawayService.updateLeadStatus(id, request);
    }

    @GetMapping("/leads/export")
    public ResponseEntity<byte[]> exportLeads() {
        byte[] excelData = giveawayService.exportLeadsToExcel();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=giveaway_leads.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excelData);
    }

    @PostMapping("/publish-post")
    public Map<String, String> publishPost(@Valid @RequestBody GiveawayPostPublishRequest request) {
        giveawayService.publishGiveawayPost(request);
        return Map.of("message", "Đã xuất bản bài viết Giveaway thành công lên Fanpage!");
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleStateError(IllegalStateException ex) {
        return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
    }
}
