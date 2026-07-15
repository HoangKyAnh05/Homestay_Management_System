package com.homestayManagement.homestayManagement.dto.response;

public record MarketingMediaUploadResponse(
        String mediaUrl,
        String mediaType,
        String originalFilename,
        long size
) {
}
