package com.homestayManagement.homestayManagement.controller;

import com.homestayManagement.homestayManagement.dto.request.RoomMiniBarItemRequest;
import com.homestayManagement.homestayManagement.dto.response.RoomMiniBarItemResponse;
import com.homestayManagement.homestayManagement.service.AdminMiniBarItemService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/services/mini-bar-items")
public class AdminMiniBarItemController {

    private final AdminMiniBarItemService adminMiniBarItemService;

    public AdminMiniBarItemController(AdminMiniBarItemService adminMiniBarItemService) {
        this.adminMiniBarItemService = adminMiniBarItemService;
    }

    @GetMapping
    public List<RoomMiniBarItemResponse> getAllItems() {
        return adminMiniBarItemService.getAllItems();
    }

    @PostMapping
    public ResponseEntity<RoomMiniBarItemResponse> createItem(@Valid @RequestBody RoomMiniBarItemRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminMiniBarItemService.createItem(request));
    }

    @PutMapping("/{id}")
    public RoomMiniBarItemResponse updateItem(@PathVariable Long id, @Valid @RequestBody RoomMiniBarItemRequest request) {
        return adminMiniBarItemService.updateItem(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteItem(@PathVariable Long id) {
        adminMiniBarItemService.deleteItem(id);
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
