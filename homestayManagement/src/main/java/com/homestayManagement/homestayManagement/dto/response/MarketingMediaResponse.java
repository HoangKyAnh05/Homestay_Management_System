package com.homestayManagement.homestayManagement.dto.response;

public record MarketingMediaResponse(
        Long id,
        String mediaUrl,
        String mediaType,
        Integer displayOrder,
        String altText,
        String source
) {
}
