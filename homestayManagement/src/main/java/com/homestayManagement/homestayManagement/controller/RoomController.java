package com.homestayManagement.homestayManagement.controller;

import com.homestayManagement.homestayManagement.dto.response.RoomTypeResponse;
import com.homestayManagement.homestayManagement.entity.Room;
import com.homestayManagement.homestayManagement.entity.RoomImage;
import com.homestayManagement.homestayManagement.entity.RoomType;
import com.homestayManagement.homestayManagement.repository.RoomImageRepository;
import com.homestayManagement.homestayManagement.repository.RoomRepository;
import com.homestayManagement.homestayManagement.repository.RoomTypeRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {

    private final RoomTypeRepository roomTypeRepository;
    private final RoomRepository roomRepository;
    private final RoomImageRepository roomImageRepository;

    public RoomController(
            RoomTypeRepository roomTypeRepository,
            RoomRepository roomRepository,
            RoomImageRepository roomImageRepository
    ) {
        this.roomTypeRepository = roomTypeRepository;
        this.roomRepository = roomRepository;
        this.roomImageRepository = roomImageRepository;
    }

    @GetMapping("/types")
    public List<RoomTypeResponse> getAllRoomTypes() {
        return roomTypeRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    private RoomTypeResponse toResponse(RoomType roomType) {
        List<Room> rooms = roomRepository.findByRoomTypeId(roomType.getId());
        List<String> allUrls = new ArrayList<>();
        String primaryUrl = null;

        for (Room room : rooms) {
            List<RoomImage> images = roomImageRepository.findByRoomId(room.getId());
            for (RoomImage img : images) {
                allUrls.add(img.getImageUrl());
                if (primaryUrl == null && img.isPrimary()) {
                    primaryUrl = img.getImageUrl();
                }
            }
        }
        if (primaryUrl == null && !allUrls.isEmpty()) {
            primaryUrl = allUrls.get(0);
        }

        return new RoomTypeResponse(
                roomType.getId(),
                roomType.getName(),
                roomType.getMaxAdults(),
                roomType.getMaxChildren(),
                roomType.getDescription(),
                primaryUrl,
                allUrls
        );
    }
}
