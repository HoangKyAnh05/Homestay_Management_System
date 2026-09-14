package com.homestayManagement.homestayManagement.dto.response;

import java.util.List;

public record AdminExcelSheetData(
        String sheetName,
        int totalRows,
        int totalColumns,
        List<List<String>> data
) {
}
