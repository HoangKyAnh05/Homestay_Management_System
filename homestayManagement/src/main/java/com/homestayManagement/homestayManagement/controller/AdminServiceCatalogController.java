package com.homestayManagement.homestayManagement.controller;

import com.homestayManagement.homestayManagement.dto.request.FacilityServiceRequest;
import com.homestayManagement.homestayManagement.dto.request.InventoryServiceRequest;
import com.homestayManagement.homestayManagement.dto.response.FacilityServiceResponse;
import com.homestayManagement.homestayManagement.dto.response.InventoryServiceResponse;
import com.homestayManagement.homestayManagement.service.AdminServiceCatalogService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/services")
public class AdminServiceCatalogController {

    private final AdminServiceCatalogService adminServiceCatalogService;

    public AdminServiceCatalogController(AdminServiceCatalogService adminServiceCatalogService) {
        this.adminServiceCatalogService = adminServiceCatalogService;
    }

    @GetMapping("/facility")
    public List<FacilityServiceResponse> getAllFacilityServices() {
        return adminServiceCatalogService.getAllFacilityServices();
    }

    @PostMapping("/facility")
    public ResponseEntity<FacilityServiceResponse> createFacilityService(@Valid @RequestBody FacilityServiceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminServiceCatalogService.createFacilityService(request));
    }

    @PutMapping("/facility/{id}")
    public FacilityServiceResponse updateFacilityService(@PathVariable Long id, @Valid @RequestBody FacilityServiceRequest request) {
        return adminServiceCatalogService.updateFacilityService(id, request);
    }

    @DeleteMapping("/facility/{id}")
    public ResponseEntity<Void> deleteFacilityService(@PathVariable Long id) {
        adminServiceCatalogService.deleteFacilityService(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/inventory")
    public List<InventoryServiceResponse> getAllInventoryServices() {
        return adminServiceCatalogService.getAllInventoryServices();
    }

    @PostMapping("/inventory")
    public ResponseEntity<InventoryServiceResponse> createInventoryService(@Valid @RequestBody InventoryServiceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminServiceCatalogService.createInventoryService(request));
    }

    @PutMapping("/inventory/{id}")
    public InventoryServiceResponse updateInventoryService(@PathVariable Long id, @Valid @RequestBody InventoryServiceRequest request) {
        return adminServiceCatalogService.updateInventoryService(id, request);
    }

    @DeleteMapping("/inventory/{id}")
    public ResponseEntity<Void> deleteInventoryService(@PathVariable Long id) {
        adminServiceCatalogService.deleteInventoryService(id);
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
