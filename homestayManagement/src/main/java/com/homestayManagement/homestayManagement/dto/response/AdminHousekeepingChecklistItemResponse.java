package com.homestayManagement.homestayManagement.dto.response;

public record AdminHousekeepingChecklistItemResponse(
        Long id,
        String title,
        String description,
        boolean required,
        boolean active,
        Integer displayOrder
) {
}
