package com.homestayManagement.homestayManagement.controller;

import com.homestayManagement.homestayManagement.dto.email.CheckoutInvoiceEmailSnapshot;
import com.homestayManagement.homestayManagement.dto.response.AdminSheetItemResponse;
import com.homestayManagement.homestayManagement.entity.Invoice;
import com.homestayManagement.homestayManagement.repository.InvoiceRepository;
import com.homestayManagement.homestayManagement.service.CheckoutInvoiceEmailService;
import com.homestayManagement.homestayManagement.service.InvoiceStorageService;
import com.homestayManagement.homestayManagement.service.TemporaryResidenceExcelService;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@RestController
@RequestMapping("/api/admin/sheets")
public class AdminSheetsController {

    private static final Logger LOGGER = LoggerFactory.getLogger(AdminSheetsController.class);

    private final TemporaryResidenceExcelService temporaryResidenceExcelService;
    private final InvoiceRepository invoiceRepository;
    private final CheckoutInvoiceEmailService checkoutInvoiceEmailService;
    private final InvoiceStorageService invoiceStorageService;

    private static final java.util.regex.Pattern TIMESTAMP_PATTERN = java.util.regex.Pattern.compile("(\\d{8})_(\\d{6})");
    private static final java.util.regex.Pattern DATE_PATTERN = java.util.regex.Pattern.compile("(\\d{4}-\\d{2}-\\d{2})");
    private static final java.util.regex.Pattern INVOICE_ID_PATTERN = java.util.regex.Pattern.compile("invoice_HD0*(\\d+)");

    public AdminSheetsController(
            TemporaryResidenceExcelService temporaryResidenceExcelService,
            InvoiceRepository invoiceRepository,
            CheckoutInvoiceEmailService checkoutInvoiceEmailService,
            InvoiceStorageService invoiceStorageService
    ) {
        this.temporaryResidenceExcelService = temporaryResidenceExcelService;
        this.invoiceRepository = invoiceRepository;
        this.checkoutInvoiceEmailService = checkoutInvoiceEmailService;
        this.invoiceStorageService = invoiceStorageService;
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
            // Tự động đồng bộ các hóa đơn mới chưa có file HTML trên đĩa theo thời gian thực
            syncMissingInvoiceHtmlFiles();

            List<AdminSheetItemResponse> invoiceResults = new ArrayList<>();
            scanDirectory(
                    Paths.get("invoive"),
                    "INVOICES",
                    "Hóa đơn điện tử khách hàng",
                    invoiceResults
            );
            scanDirectory(
                    Paths.get("invoice"),
                    "INVOICES",
                    "Hóa đơn điện tử khách hàng",
                    invoiceResults
            );

            // Deduplicate invoices: if multiple files exist for the same invoice, keep the one with newest timestamp
            Map<String, AdminSheetItemResponse> deduplicatedInvoices = new LinkedHashMap<>();
            for (AdminSheetItemResponse item : invoiceResults) {
                String key = extractInvoiceKey(item.fileName());
                if (!deduplicatedInvoices.containsKey(key)) {
                    deduplicatedInvoices.put(key, item);
                } else {
                    AdminSheetItemResponse existing = deduplicatedInvoices.get(key);
                    if (item.lastModified() != null && (existing.lastModified() == null || item.lastModified().isAfter(existing.lastModified()))) {
                        deduplicatedInvoices.put(key, item);
                    }
                }
            }
            results.addAll(deduplicatedInvoices.values());
        }

        return results.stream()
                .sorted((a, b) -> {
                    LocalDateTime tA = a.lastModified();
                    LocalDateTime tB = b.lastModified();
                    if (tA != null && tB != null && !tA.isEqual(tB)) {
                        return tB.compareTo(tA);
                    }
                    Long idA = extractInvoiceId(a.fileName());
                    Long idB = extractInvoiceId(b.fileName());
                    if (idA != null && idB != null && !idA.equals(idB)) {
                        return idB.compareTo(idA);
                    }
                    return b.fileName().compareTo(a.fileName());
                })
                .collect(Collectors.toList());
    }

    private String extractInvoiceKey(String fileName) {
        if (fileName == null) return UUID.randomUUID().toString();
        // Remove trailing timestamp _YYYYMMDD_HHmmss.html to group duplicates
        java.util.regex.Matcher m = java.util.regex.Pattern.compile("^(.*?)(?:_\\d{8}_\\d{6})?(\\.html)?$", java.util.regex.Pattern.CASE_INSENSITIVE).matcher(fileName);
        if (m.find()) {
            return m.group(1).toLowerCase();
        }
        return fileName.toLowerCase();
    }

    private Long extractInvoiceId(String fileName) {
        if (fileName == null) return null;
        java.util.regex.Matcher m = INVOICE_ID_PATTERN.matcher(fileName);
        if (m.find()) {
            try {
                return Long.parseLong(m.group(1));
            } catch (NumberFormatException ignored) {}
        }
        return null;
    }

    private void syncMissingInvoiceHtmlFiles() {
        try {
            if (invoiceRepository == null || checkoutInvoiceEmailService == null || invoiceStorageService == null) {
                return;
            }

            Path invoiveDir = Paths.get("invoive").toAbsolutePath().normalize();
            if (!Files.exists(invoiveDir)) {
                Files.createDirectories(invoiveDir);
            }

            Set<String> existingFileNames = new HashSet<>();
            try (Stream<Path> stream = Files.list(invoiveDir)) {
                stream.filter(Files::isRegularFile).forEach(p -> existingFileNames.add(p.getFileName().toString()));
            } catch (Exception ignored) {}

            Path altDir = Paths.get("invoice").toAbsolutePath().normalize();
            if (Files.exists(altDir)) {
                try (Stream<Path> stream = Files.list(altDir)) {
                    stream.filter(Files::isRegularFile).forEach(p -> existingFileNames.add(p.getFileName().toString()));
                } catch (Exception ignored) {}
            }

            List<Invoice> invoices = invoiceRepository.findAll();
            for (Invoice inv : invoices) {
                if (inv == null || inv.getId() == null) continue;
                String idStr = String.valueOf(inv.getId());
                String pad2 = String.format("%02d", inv.getId());
                String pad3 = String.format("%03d", inv.getId());
                String pad4 = String.format("%04d", inv.getId());

                boolean hasFile = existingFileNames.stream().anyMatch(name ->
                        name.startsWith("invoice_HD" + pad2 + "_") ||
                        name.startsWith("invoice_HD" + idStr + "_") ||
                        name.startsWith("invoice_HD" + pad3 + "_") ||
                        name.startsWith("invoice_HD" + pad4 + "_") ||
                        name.startsWith("invoice_" + idStr + "_") ||
                        name.contains("_HD" + pad2 + "_") ||
                        name.contains("_HD" + idStr + "_")
                );

                if (!hasFile) {
                    try {
                        CheckoutInvoiceEmailSnapshot snapshot = checkoutInvoiceEmailService.buildSnapshot(inv.getId());
                        String html = checkoutInvoiceEmailService.renderHtml(snapshot);
                        Path saved = invoiceStorageService.saveInvoiceHtml(snapshot, html);
                        if (saved != null) {
                            existingFileNames.add(saved.getFileName().toString());
                        }
                    } catch (Exception ex) {
                        LOGGER.warn("Không thể tự động xuất HTML hóa đơn ID={}: {}", inv.getId(), ex.getMessage());
                    }
                }
            }
        } catch (Exception e) {
            LOGGER.error("Lỗi khi đồng bộ file hóa đơn điện tử: {}", e.getMessage());
        }
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
                        try {
                            size = Files.size(file);
                        } catch (IOException ignored) {}

                        LocalDateTime lastMod = extractDateTime(file, fileName);

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

    private LocalDateTime extractDateTime(Path file, String fileName) {
        try {
            java.util.regex.Matcher m = TIMESTAMP_PATTERN.matcher(fileName);
            if (m.find()) {
                String dateStr = m.group(1);
                String timeStr = m.group(2);
                return LocalDateTime.parse(dateStr + "_" + timeStr, java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            }
            java.util.regex.Matcher mDate = DATE_PATTERN.matcher(fileName);
            if (mDate.find()) {
                return LocalDate.parse(mDate.group(1)).atStartOfDay();
            }
        } catch (Exception ignored) {}

        try {
            Instant instant = Files.getLastModifiedTime(file).toInstant();
            return LocalDateTime.ofInstant(instant, ZoneId.systemDefault());
        } catch (IOException ignored) {}

        return LocalDateTime.now();
    }

    private String formatSize(long bytes) {
        if (bytes < 1024) return bytes + " B";
        int z = (63 - Long.numberOfLeadingZeros(bytes)) / 10;
        return String.format("%.1f %sB", (double) bytes / (1L << (z * 10)), " KMGTPE".charAt(z));
    }

    private Map<String, Object> parseExcelToTable(Path filePath) {
        List<String> headers = new ArrayList<>();
        List<List<String>> rows = new ArrayList<>();

        try (InputStream is = Files.newInputStream(filePath);
             Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            if (sheet == null) {
                return Map.of("headers", headers, "rows", rows);
            }

            DataFormatter formatter = new DataFormatter();
            boolean firstRowFound = false;

            for (Row row : sheet) {
                if (row == null) continue;
                List<String> cellValues = new ArrayList<>();
                boolean rowHasContent = false;

                for (int c = 0; c < row.getLastCellNum(); c++) {
                    Cell cell = row.getCell(c, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
                    String val = cell == null ? "" : formatter.formatCellValue(cell).trim();
                    if (!val.isEmpty()) {
                        rowHasContent = true;
                    }
                    cellValues.add(val);
                }

                if (rowHasContent) {
                    if (!firstRowFound) {
                        headers = cellValues;
                        firstRowFound = true;
                    } else {
                        rows.add(cellValues);
                    }
                }
            }
        } catch (Exception e) {
            LOGGER.error("Lỗi khi đọc file Excel {}: {}", filePath.getFileName(), e.getMessage());
        }

        return Map.of("headers", headers, "rows", rows);
    }

    @GetMapping("/preview-invoice")
    public ResponseEntity<String> previewInvoice(
            @RequestParam(value = "folder", required = false) String folder,
            @RequestParam("fileName") String fileName
    ) {
        // Auto sync just in case
        syncMissingInvoiceHtmlFiles();

        Path filePath = resolveSafeFilePath(folder, fileName);
        if (filePath == null || !Files.exists(filePath)) {
            return ResponseEntity.notFound().build();
        }

        try {
            String content = Files.readString(filePath);
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType("text/html; charset=UTF-8"))
                    .body(content);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("Không thể đọc file hóa đơn: " + e.getMessage());
        }
    }

    @GetMapping("/preview-excel")
    public ResponseEntity<Map<String, Object>> previewExcel(
            @RequestParam(value = "folder", required = false) String folder,
            @RequestParam("fileName") String fileName
    ) {
        Path filePath = resolveSafeFilePath(folder, fileName);
        if (filePath == null || !Files.exists(filePath)) {
            return ResponseEntity.notFound().build();
        }

        try {
            Map<String, Object> data = parseExcelToTable(filePath);
            return ResponseEntity.ok(data);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "error", "Không thể đọc nội dung file Excel",
                    "details", e.getMessage() != null ? e.getMessage() : "Lỗi không xác định"
            ));
        }
    }

    @GetMapping("/download")
    public ResponseEntity<Resource> downloadFile(
            @RequestParam(value = "folder", required = false) String folder,
            @RequestParam("fileName") String fileName
    ) {
        Path filePath = resolveSafeFilePath(folder, fileName);
        if (filePath == null || !Files.exists(filePath)) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = new FileSystemResource(filePath.toFile());
        String contentType = "application/octet-stream";
        String lower = fileName.toLowerCase();
        if (lower.endsWith(".xlsx")) {
            contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        } else if (lower.endsWith(".html") || lower.endsWith(".htm")) {
            contentType = "text/html; charset=UTF-8";
        } else if (lower.endsWith(".csv")) {
            contentType = "text/csv; charset=UTF-8";
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(fileName).build().toString())
                .contentType(MediaType.parseMediaType(contentType))
                .body(resource);
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
