package com.homestayManagement.homestayManagement.controller;

import com.homestayManagement.homestayManagement.dto.request.RulesPenaltyRequest;
import com.homestayManagement.homestayManagement.dto.response.RulesPenaltyResponse;
import com.homestayManagement.homestayManagement.service.AdminRulesPenaltyService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/rules-penalties")
public class AdminRulesPenaltyController {

    private final AdminRulesPenaltyService adminRulesPenaltyService;

    public AdminRulesPenaltyController(AdminRulesPenaltyService adminRulesPenaltyService) {
        this.adminRulesPenaltyService = adminRulesPenaltyService;
    }

    @GetMapping
    public List<RulesPenaltyResponse> getAllRulesPenalties() {
        return adminRulesPenaltyService.getAllRulesPenalties();
    }

    @PostMapping
    public ResponseEntity<RulesPenaltyResponse> createRulesPenalty(@Valid @RequestBody RulesPenaltyRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminRulesPenaltyService.createRulesPenalty(request));
    }

    @PutMapping("/{id}")
    public RulesPenaltyResponse updateRulesPenalty(@PathVariable Long id, @Valid @RequestBody RulesPenaltyRequest request) {
        return adminRulesPenaltyService.updateRulesPenalty(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRulesPenalty(@PathVariable Long id) {
        adminRulesPenaltyService.deleteRulesPenalty(id);
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegal(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException e) {
        String msg = e.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(err -> err.getDefaultMessage())
                .orElse("Dữ liệu không hợp lệ");
        return ResponseEntity.badRequest().body(Map.of("message", msg));
    }
}
