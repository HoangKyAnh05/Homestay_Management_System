package com.homestayManagement.homestayManagement.dto.response;

public record MarketingSuggestionResponse(
        Long id,
        String title,
        String description,
        String suggestionType,
        String status
) {
}
