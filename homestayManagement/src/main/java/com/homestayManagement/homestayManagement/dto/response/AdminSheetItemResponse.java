package com.homestayManagement.homestayManagement.dto.response;

import java.time.LocalDateTime;

public record AdminSheetItemResponse(
        String id,
        String fileName,
        String folder,
        String folderLabel,
        long sizeBytes,
        String formattedSize,
        LocalDateTime lastModified,
        String fileType,
        String downloadUrl,
        String previewUrl,
        String extraInfo
) {
}
