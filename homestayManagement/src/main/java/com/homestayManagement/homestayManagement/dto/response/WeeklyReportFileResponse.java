package com.homestayManagement.homestayManagement.dto.response;

import java.time.LocalDateTime;

public record WeeklyReportFileResponse(
        String fileName,
        String dateRangeLabel,
        long fileSizeBytes,
        LocalDateTime createdAt,
        String downloadUrl
) {
}
