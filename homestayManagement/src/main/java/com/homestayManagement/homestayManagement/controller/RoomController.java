package com.homestayManagement.homestayManagement.controller;

import com.homestayManagement.homestayManagement.dto.response.RoomTypeResponse;
import com.homestayManagement.homestayManagement.dto.response.RoomSearchResponse;
import com.homestayManagement.homestayManagement.service.RoomService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {

    private final RoomService roomService;

    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    @GetMapping("/types")
    public List<RoomTypeResponse> getAllRoomTypes() {
        return roomService.getAllRoomTypes();
    }

    @GetMapping("/search")
    public List<RoomSearchResponse> searchAvailableRooms(
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate checkInDate,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate checkOutDate,
            @RequestParam(defaultValue = "1") Integer rooms,
            @RequestParam(defaultValue = "1") Integer adults,
            @RequestParam(defaultValue = "0") Integer children,
            @RequestParam(required = false) BigDecimal maxPrice
    ) {
        return roomService.searchAvailableRooms(checkInDate, checkOutDate, rooms, adults, children, maxPrice);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegal(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    }
}
