package com.homestayManagement.homestayManagement.dto.response;

public record RoomImageResponse(
        Long id,
        String imageUrl,
        boolean primary
) {
}
