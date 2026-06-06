package com.homestayManagement.homestayManagement.controller;

import com.homestayManagement.homestayManagement.dto.response.RoomTypeResponse;
import com.homestayManagement.homestayManagement.entity.RoomImage;
import com.homestayManagement.homestayManagement.entity.RoomType;
import com.homestayManagement.homestayManagement.repository.RoomImageRepository;
import com.homestayManagement.homestayManagement.repository.RoomTypeRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {

    private final RoomTypeRepository roomTypeRepository;
    private final RoomImageRepository roomImageRepository;

    public RoomController(RoomTypeRepository roomTypeRepository, RoomImageRepository roomImageRepository) {
        this.roomTypeRepository = roomTypeRepository;
        this.roomImageRepository = roomImageRepository;
    }

    @GetMapping("/types")
    public List<RoomTypeResponse> getAllRoomTypes() {
        return roomTypeRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    private RoomTypeResponse toResponse(RoomType roomType) {
        List<RoomImage> images = roomImageRepository.findByRoomTypeId(roomType.getId());
        String primaryUrl = images.stream()
                .filter(RoomImage::isPrimary)
                .map(RoomImage::getImageUrl)
                .findFirst()
                .orElse(images.isEmpty() ? null : images.get(0).getImageUrl());
        List<String> allUrls = images.stream().map(RoomImage::getImageUrl).toList();

        return new RoomTypeResponse(
                roomType.getId(),
                roomType.getName(),
                roomType.getBasePrice(),
                roomType.getMaxAdults(),
                roomType.getMaxChildren(),
                roomType.getDescription(),
                primaryUrl,
                allUrls
        );
    }
}
