package com.homestayManagement.homestayManagement.controller;

import com.homestayManagement.homestayManagement.dto.request.AdminCreateUserRequest;
import com.homestayManagement.homestayManagement.dto.request.AdminUpdateUserRequest;
import com.homestayManagement.homestayManagement.dto.request.ToggleActiveRequest;
import com.homestayManagement.homestayManagement.dto.response.AdminUserResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminCustomerBookingHistoryResponse;
import com.homestayManagement.homestayManagement.entity.Role;
import com.homestayManagement.homestayManagement.repository.RoleRepository;
import com.homestayManagement.homestayManagement.service.AdminUserService;
import com.homestayManagement.homestayManagement.service.AdminCustomerHistoryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final AdminUserService adminUserService;
    private final AdminCustomerHistoryService adminCustomerHistoryService;
    private final RoleRepository roleRepository;

    public AdminUserController(
            AdminUserService adminUserService,
            AdminCustomerHistoryService adminCustomerHistoryService,
            RoleRepository roleRepository
    ) {
        this.adminUserService = adminUserService;
        this.adminCustomerHistoryService = adminCustomerHistoryService;
        this.roleRepository = roleRepository;
    }

    @GetMapping
    public List<AdminUserResponse> getAllUsers() {
        return adminUserService.getAllUsers();
    }

    @GetMapping("/roles")
    public List<Role> getAllRoles() {
        return roleRepository.findAll();
    }

    @GetMapping("/{id}")
    public AdminUserResponse getUserById(@PathVariable Long id) {
        return adminUserService.getUserById(id);
    }

    @GetMapping("/{id}/booking-history")
    public AdminCustomerBookingHistoryResponse getCustomerBookingHistory(@PathVariable Long id) {
        return adminCustomerHistoryService.getBookingHistory(id);
    }

    @PostMapping
    public ResponseEntity<AdminUserResponse> createUser(@Valid @RequestBody AdminCreateUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminUserService.createUser(request));
    }

    @PutMapping("/{id}")
    public AdminUserResponse updateUser(
            @PathVariable Long id,
            @Valid @RequestBody AdminUpdateUserRequest request
    ) {
        return adminUserService.updateUser(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        adminUserService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/toggle-active")
    public AdminUserResponse toggleActive(
            @PathVariable Long id,
            @RequestBody ToggleActiveRequest request
    ) {
        return adminUserService.toggleActive(id, request.isActive());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(err -> err.getDefaultMessage())
                .orElse("Dữ liệu không hợp lệ");
        return ResponseEntity.badRequest().body(Map.of("message", message));
    }
}
