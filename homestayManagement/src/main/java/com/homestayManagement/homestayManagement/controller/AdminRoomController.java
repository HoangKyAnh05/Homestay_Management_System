package com.homestayManagement.homestayManagement.controller;

import com.homestayManagement.homestayManagement.dto.request.RoomRequest;
import com.homestayManagement.homestayManagement.dto.request.RoomTypeRequest;
import com.homestayManagement.homestayManagement.dto.response.AdminRoomResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminRoomTypeResponse;
import com.homestayManagement.homestayManagement.service.AdminRoomService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/rooms")
public class AdminRoomController {

    private final AdminRoomService adminRoomService;

    public AdminRoomController(AdminRoomService adminRoomService) {
        this.adminRoomService = adminRoomService;
    }

    // ── RoomType CRUD ─────────────────────────────────────

    @GetMapping("/types")
    public List<AdminRoomTypeResponse> getAllRoomTypes() {
        return adminRoomService.getAllRoomTypes();
    }

    @PostMapping("/types")
    public ResponseEntity<AdminRoomTypeResponse> createRoomType(@Valid @RequestBody RoomTypeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminRoomService.createRoomType(request));
    }

    @PutMapping("/types/{id}")
    public AdminRoomTypeResponse updateRoomType(@PathVariable Long id, @Valid @RequestBody RoomTypeRequest request) {
        return adminRoomService.updateRoomType(id, request);
    }

    @DeleteMapping("/types/{id}")
    public ResponseEntity<Void> deleteRoomType(@PathVariable Long id) {
        adminRoomService.deleteRoomType(id);
        return ResponseEntity.noContent().build();
    }

    // ── Room CRUD ─────────────────────────────────────────

    @GetMapping
    public List<AdminRoomResponse> getAllRooms() {
        return adminRoomService.getAllRooms();
    }

    @PostMapping
    public ResponseEntity<AdminRoomResponse> createRoom(@Valid @RequestBody RoomRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminRoomService.createRoom(request));
    }

    @PutMapping("/{id}")
    public AdminRoomResponse updateRoom(@PathVariable Long id, @Valid @RequestBody RoomRequest request) {
        return adminRoomService.updateRoom(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRoom(@PathVariable Long id) {
        adminRoomService.deleteRoom(id);
        return ResponseEntity.noContent().build();
    }

    // ── Images (per physical room) ────────────────────────

    @PostMapping(value = "/{roomId}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public AdminRoomResponse addImages(
            @PathVariable Long roomId,
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(value = "primaryImageId", required = false) Long primaryImageId
    ) {
        return adminRoomService.addImages(roomId, files, primaryImageId);
    }

    @DeleteMapping("/{roomId}/images/{imageId}")
    public AdminRoomResponse deleteImage(@PathVariable Long roomId, @PathVariable Long imageId) {
        return adminRoomService.deleteImage(roomId, imageId);
    }

    @PatchMapping("/{roomId}/images/{imageId}/primary")
    public AdminRoomResponse setPrimaryImage(@PathVariable Long roomId, @PathVariable Long imageId) {
        return adminRoomService.setPrimaryImage(roomId, imageId);
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
