package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.response.RoomSearchResponse;
import com.homestayManagement.homestayManagement.dto.response.RoomDetailPublicResponse;
import com.homestayManagement.homestayManagement.dto.response.RoomPublicResponse;
import com.homestayManagement.homestayManagement.dto.response.RoomTypeResponse;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface RoomService {
    List<RoomTypeResponse> getAllRoomTypes();
    List<RoomPublicResponse> getAllPublicRooms();
    RoomDetailPublicResponse getPublicRoomDetail(Long roomId, LocalDate fromDate, LocalDate toDate);
    List<RoomSearchResponse> searchAvailableRooms(
            LocalDate checkInDate,
            LocalDate checkOutDate,
            Integer rooms,
            Integer adults,
            Integer children,
            BigDecimal maxPrice
    );
}
