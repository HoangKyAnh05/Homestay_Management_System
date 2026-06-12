package com.homestayManagement.homestayManagement.controller;

import com.homestayManagement.homestayManagement.dto.request.PricePolicyRequest;
import com.homestayManagement.homestayManagement.dto.request.RoomPriceConfigRequest;
import com.homestayManagement.homestayManagement.dto.response.PricePolicyResponse;
import com.homestayManagement.homestayManagement.dto.response.RoomPriceConfigResponse;
import com.homestayManagement.homestayManagement.service.PriceConfigService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/price-config")
public class AdminPriceConfigController {

    private final PriceConfigService priceConfigService;

    public AdminPriceConfigController(PriceConfigService priceConfigService) {
        this.priceConfigService = priceConfigService;
    }

    // ── PricePolicy ───────────────────────────────────────

    @GetMapping("/policies")
    public List<PricePolicyResponse> getAllPolicies() {
        return priceConfigService.getAllPolicies();
    }

    @PostMapping("/policies")
    public ResponseEntity<PricePolicyResponse> createPolicy(@Valid @RequestBody PricePolicyRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(priceConfigService.createPolicy(request));
    }

    @PutMapping("/policies/{id}")
    public PricePolicyResponse updatePolicy(@PathVariable Long id, @Valid @RequestBody PricePolicyRequest request) {
        return priceConfigService.updatePolicy(id, request);
    }

    @DeleteMapping("/policies/{id}")
    public ResponseEntity<Void> deletePolicy(@PathVariable Long id) {
        priceConfigService.deletePolicy(id);
        return ResponseEntity.noContent().build();
    }

    // ── RoomPriceConfig ───────────────────────────────────

    @GetMapping("/configs")
    public List<RoomPriceConfigResponse> getAllConfigs() {
        return priceConfigService.getAllConfigs();
    }

    @GetMapping("/configs/by-room-type/{roomTypeId}")
    public List<RoomPriceConfigResponse> getConfigsByRoomType(@PathVariable Long roomTypeId) {
        return priceConfigService.getConfigsByRoomType(roomTypeId);
    }

    @PostMapping("/configs")
    public ResponseEntity<RoomPriceConfigResponse> createConfig(@Valid @RequestBody RoomPriceConfigRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(priceConfigService.createConfig(request));
    }

    @PutMapping("/configs/{id}")
    public RoomPriceConfigResponse updateConfig(@PathVariable Long id, @Valid @RequestBody RoomPriceConfigRequest request) {
        return priceConfigService.updateConfig(id, request);
    }

    @DeleteMapping("/configs/{id}")
    public ResponseEntity<Void> deleteConfig(@PathVariable Long id) {
        priceConfigService.deleteConfig(id);
        return ResponseEntity.noContent().build();
    }

    // ── Exception handlers ────────────────────────────────

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegal(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException e) {
        String msg = e.getBindingResult().getFieldErrors().stream()
                .findFirst().map(err -> err.getDefaultMessage()).orElse("Dữ liệu không hợp lệ");
        return ResponseEntity.badRequest().body(Map.of("message", msg));
    }
}
