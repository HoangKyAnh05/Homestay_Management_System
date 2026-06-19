package com.homestayManagement.homestayManagement.dto.response;

import java.time.LocalDateTime;

public record HousekeepingCleaningChecklistItemResponse(
        Long id,
        String title,
        String description,
        boolean required,
        Integer displayOrder,
        boolean completed,
        Long completedById,
        String completedByName,
        LocalDateTime completedAt
) {
}
