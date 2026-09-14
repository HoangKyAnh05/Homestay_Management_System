package com.homestayManagement.homestayManagement.controller;

import com.homestayManagement.homestayManagement.dto.response.AdminSheetItemResponse;
import com.homestayManagement.homestayManagement.service.TemporaryResidenceExcelService;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/sheets")
public class AdminSheetsController {

    private final TemporaryResidenceExcelService temporaryResidenceExcelService;

    public AdminSheetsController(TemporaryResidenceExcelService temporaryResidenceExcelService) {
        this.temporaryResidenceExcelService = temporaryResidenceExcelService;
    }

    @GetMapping("/files")
    public List<AdminSheetItemResponse> listFiles(
            @RequestParam(value = "folder", required = false) String folder
    ) {
        List<AdminSheetItemResponse> results = new ArrayList<>();

        // 1. Temporary residence sheets: exports/temporary-residence/
        if (folder == null || "TEMPORARY_RESIDENCE".equalsIgnoreCase(folder)) {
            scanDirectory(
                    Paths.get("exports", "temporary-residence"),
                    "TEMPORARY_RESIDENCE",
                    "Khai báo tạm trú (Công an)",
                    results
            );
        }

        // 2. Dashboard & Weekly reports: exports/dashboard-reports/
        if (folder == null || "DASHBOARD_REPORTS".equalsIgnoreCase(folder) || "WEEKLY_REPORTS".equalsIgnoreCase(folder)) {
            scanDirectory(
                    Paths.get("exports", "dashboard-reports"),
                    "DASHBOARD_REPORTS",
                    "Báo cáo vận hành & doanh thu",
                    results
            );
        }

        // 3. Invoices: invoive/ or invoice/
        if (folder == null || "INVOICES".equalsIgnoreCase(folder) || "INVOICE".equalsIgnoreCase(folder)) {
            scanDirectory(
                    Paths.get("invoive"),
                    "INVOICES",
                    "Hóa đơn điện tử khách hàng",
                    results
            );
            scanDirectory(
                    Paths.get("invoice"),
                    "INVOICES",
                    "Hóa đơn điện tử khách hàng",
                    results
            );
        }

        return results.stream()
                .sorted(Comparator.comparing(AdminSheetItemResponse::lastModified, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    private void scanDirectory(Path dirPath, String folderType, String folderLabel, List<AdminSheetItemResponse> list) {
        if (!Files.exists(dirPath)) return;
        try {
            Files.walk(dirPath)
                    .filter(Files::isRegularFile)
                    .forEach(file -> {
                        String fileName = file.getFileName().toString();
                        if (fileName.startsWith(".")) return; // skip hidden

                        long size = 0;
                        LocalDateTime lastMod = LocalDateTime.now();
                        try {
                            size = Files.size(file);
                            Instant instant = Files.getLastModifiedTime(file).toInstant();
                            lastMod = LocalDateTime.ofInstant(instant, ZoneId.systemDefault());
                        } catch (IOException ignored) {}

                        String fileType = "OTHER";
                        String lowerName = fileName.toLowerCase();
                        if (lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls") || lowerName.endsWith(".csv")) {
                            fileType = "EXCEL";
                        } else if (lowerName.endsWith(".html") || lowerName.endsWith(".htm")) {
                            fileType = "HTML";
                        } else if (lowerName.endsWith(".pdf")) {
                            fileType = "PDF";
                        }

                        String formattedSize = formatSize(size);
                        String id = folderType + "::" + dirPath.relativize(file).toString().replace('\\', '/');

                        String downloadUrl = "/api/admin/sheets/download?folder=" + folderType + "&fileName=" + fileName;
                        String previewUrl = "HTML".equals(fileType)
                                ? "/api/admin/sheets/preview-invoice?fileName=" + fileName
                                : null;

                        list.add(new AdminSheetItemResponse(
                                id,
                                fileName,
                                folderType,
                                folderLabel,
                                size,
                                formattedSize,
                                lastMod,
                                fileType,
                                downloadUrl,
                                previewUrl,
                                dirPath.toString().replace('\\', '/')
                        ));
                    });
        } catch (IOException ignored) {}
    }

    private String formatSize(long bytes) {
        if (bytes < 1024) return bytes + " B";
        int z = (63 - Long.numberOfLeadingZeros(bytes)) / 10;
        return String.format("%.1f %sB", (double) bytes / (1L << (z * 10)), " KMGTPE".charAt(z));
    }

    @GetMapping("/download")
    public ResponseEntity<Resource> downloadFile(
            @RequestParam("folder") String folder,
            @RequestParam("fileName") String fileName
    ) {
        Path targetPath = resolveSafeFilePath(folder, fileName);
        if (targetPath == null || !Files.exists(targetPath) || !Files.isRegularFile(targetPath)) {
            return ResponseEntity.notFound().build();
        }

        String lower = fileName.toLowerCase();
        String mediaType = "application/octet-stream";
        if (lower.endsWith(".xlsx")) {
            mediaType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        } else if (lower.endsWith(".html")) {
            mediaType = "text/html; charset=UTF-8";
        } else if (lower.endsWith(".pdf")) {
            mediaType = "application/pdf";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(mediaType))
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(fileName).build().toString())
                .body(new FileSystemResource(targetPath));
    }

    @GetMapping("/preview-invoice")
    public ResponseEntity<String> previewInvoice(@RequestParam("fileName") String fileName) {
        Path targetPath = resolveSafeFilePath("INVOICES", fileName);
        if (targetPath == null || !Files.exists(targetPath)) {
            return ResponseEntity.notFound().build();
        }

        try {
            String content = Files.readString(targetPath);
            return ResponseEntity.ok()
                    .contentType(MediaType.valueOf("text/html; charset=UTF-8"))
                    .body(content);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("Không thể đọc file hóa đơn: " + e.getMessage());
        }
    }

    @GetMapping("/preview-excel")
    public ResponseEntity<?> previewExcel(
            @RequestParam(value = "folder", required = false) String folder,
            @RequestParam("fileName") String fileName
    ) {
        Path targetPath = resolveSafeFilePath(folder, fileName);
        if (targetPath == null || !Files.exists(targetPath) || !Files.isRegularFile(targetPath)) {
            return ResponseEntity.notFound().build();
        }

        try (java.io.InputStream is = Files.newInputStream(targetPath);
             org.apache.poi.ss.usermodel.Workbook workbook = org.apache.poi.ss.usermodel.WorkbookFactory.create(is)) {

            org.apache.poi.ss.usermodel.DataFormatter formatter = new org.apache.poi.ss.usermodel.DataFormatter();
            List<com.homestayManagement.homestayManagement.dto.response.AdminExcelSheetData> sheetDataList = new ArrayList<>();

            for (int i = 0; i < workbook.getNumberOfSheets(); i++) {
                org.apache.poi.ss.usermodel.Sheet sheet = workbook.getSheetAt(i);
                String sheetName = sheet.getSheetName();
                List<List<String>> rows = new ArrayList<>();
                int maxCols = 0;

                int lastRowNum = sheet.getLastRowNum();
                for (int r = 0; r <= lastRowNum; r++) {
                    org.apache.poi.ss.usermodel.Row row = sheet.getRow(r);
                    List<String> rowCells = new ArrayList<>();
                    if (row != null) {
                        short lastCellNum = row.getLastCellNum();
                        if (lastCellNum > maxCols) {
                            maxCols = lastCellNum;
                        }
                        for (int c = 0; c < lastCellNum; c++) {
                            org.apache.poi.ss.usermodel.Cell cell = row.getCell(c, org.apache.poi.ss.usermodel.Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
                            if (cell == null) {
                                rowCells.add("");
                            } else {
                                rowCells.add(formatter.formatCellValue(cell));
                            }
                        }
                    }
                    rows.add(rowCells);
                }

                sheetDataList.add(new com.homestayManagement.homestayManagement.dto.response.AdminExcelSheetData(
                        sheetName,
                        rows.size(),
                        maxCols,
                        rows
                ));
            }

            return ResponseEntity.ok(new com.homestayManagement.homestayManagement.dto.response.AdminExcelPreviewResponse(
                    fileName,
                    folder != null ? folder : "EXPORTS",
                    sheetDataList
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Không thể đọc file Excel: " + e.getMessage());
        }
    }

    @PostMapping("/generate-temporary-residence")
    public ResponseEntity<AdminSheetItemResponse> generateTemporaryResidence(
            @RequestParam(value = "date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate date
    ) {
        LocalDate exportDate = date != null ? date : LocalDate.now();
        Path file = temporaryResidenceExcelService.exportByDate(exportDate);
        String fileName = file.getFileName().toString();

        long size = 0;
        try {
            size = Files.size(file);
        } catch (IOException ignored) {}

        AdminSheetItemResponse response = new AdminSheetItemResponse(
                "TEMPORARY_RESIDENCE::" + fileName,
                fileName,
                "TEMPORARY_RESIDENCE",
                "Khai báo tạm trú (Công an)",
                size,
                formatSize(size),
                LocalDateTime.now(),
                "EXCEL",
                "/api/admin/sheets/download?folder=TEMPORARY_RESIDENCE&fileName=" + fileName,
                null,
                file.getParent().toString()
        );

        return ResponseEntity.ok(response);
    }

    private Path resolveSafeFilePath(String folder, String fileName) {
        // Prevent path traversal
        if (fileName == null || fileName.contains("..") || fileName.contains("/") || fileName.contains("\\")) {
            return null;
        }

        List<Path> candidateRoots = new ArrayList<>();
        if ("TEMPORARY_RESIDENCE".equalsIgnoreCase(folder)) {
            candidateRoots.add(Paths.get("exports", "temporary-residence"));
        } else if ("DASHBOARD_REPORTS".equalsIgnoreCase(folder) || "WEEKLY_REPORTS".equalsIgnoreCase(folder)) {
            candidateRoots.add(Paths.get("exports", "dashboard-reports"));
            candidateRoots.add(Paths.get("exports", "dashboard-reports", "weekly"));
        } else if ("INVOICES".equalsIgnoreCase(folder) || "INVOICE".equalsIgnoreCase(folder)) {
            candidateRoots.add(Paths.get("invoive"));
            candidateRoots.add(Paths.get("invoice"));
        } else {
            candidateRoots.add(Paths.get("exports", "temporary-residence"));
            candidateRoots.add(Paths.get("exports", "dashboard-reports"));
            candidateRoots.add(Paths.get("exports", "dashboard-reports", "weekly"));
            candidateRoots.add(Paths.get("invoive"));
            candidateRoots.add(Paths.get("invoice"));
        }

        for (Path root : candidateRoots) {
            Path candidate = root.resolve(fileName);
            if (Files.exists(candidate)) {
                return candidate;
            }
        }
        return null;
    }
}
