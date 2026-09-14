package com.homestayManagement.homestayManagement.dto.response;

import java.util.List;

public record AdminExcelPreviewResponse(
        String fileName,
        String folder,
        List<AdminExcelSheetData> sheets
) {
}
