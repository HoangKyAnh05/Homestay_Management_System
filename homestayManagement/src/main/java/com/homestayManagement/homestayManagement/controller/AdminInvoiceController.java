package com.homestayManagement.homestayManagement.controller;

import com.homestayManagement.homestayManagement.dto.response.AdminInvoiceResponse;
import com.homestayManagement.homestayManagement.service.AdminInvoiceService;
import com.homestayManagement.homestayManagement.service.InvoiceExcelService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/invoices")
public class AdminInvoiceController {

    private static final String EXCEL_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    private final AdminInvoiceService adminInvoiceService;
    private final InvoiceExcelService invoiceExcelService;

    public AdminInvoiceController(AdminInvoiceService adminInvoiceService, InvoiceExcelService invoiceExcelService) {
        this.adminInvoiceService = adminInvoiceService;
        this.invoiceExcelService = invoiceExcelService;
    }

    @GetMapping
    public List<AdminInvoiceResponse> getAllInvoices() {
        return adminInvoiceService.getAllInvoices();
    }

    @GetMapping("/{id}")
    public AdminInvoiceResponse getInvoice(@PathVariable Long id) {
        return adminInvoiceService.getInvoice(id);
    }

    @GetMapping("/export-excel")
    public ResponseEntity<byte[]> exportExcel(
            @RequestParam(value = "fromDate", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate fromDate,
            @RequestParam(value = "toDate", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate toDate,
            @RequestParam(value = "invoiceId", required = false)
            Long invoiceId,
            @RequestParam(value = "bookingId", required = false)
            Long bookingId
    ) {
        byte[] excelBytes;
        String rawFileName;

        if (invoiceId != null) {
            excelBytes = invoiceExcelService.exportSingleInvoiceExcel(invoiceId);
            rawFileName = String.format("Hoa_Don_HD_%d.xlsx", invoiceId);
        } else if (bookingId != null) {
            excelBytes = invoiceExcelService.exportInvoiceByBookingIdExcel(bookingId);
            rawFileName = String.format("Hoa_Don_Booking_%d.xlsx", bookingId);
        } else {
            if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
                throw new IllegalArgumentException("Ngày bắt đầu không được lớn hơn ngày kết thúc");
            }
            excelBytes = invoiceExcelService.exportInvoicesExcel(fromDate, toDate);
            if (fromDate != null && toDate != null) {
                rawFileName = String.format("Danh_Sach_Hoa_Don_Tu_%s_Den_%s.xlsx",
                        fromDate.format(DateTimeFormatter.BASIC_ISO_DATE),
                        toDate.format(DateTimeFormatter.BASIC_ISO_DATE));
            } else if (fromDate != null) {
                rawFileName = String.format("Danh_Sach_Hoa_Don_Tu_%s.xlsx",
                        fromDate.format(DateTimeFormatter.BASIC_ISO_DATE));
            } else if (toDate != null) {
                rawFileName = String.format("Danh_Sach_Hoa_Don_Den_%s.xlsx",
                        toDate.format(DateTimeFormatter.BASIC_ISO_DATE));
            } else {
                rawFileName = "Danh_Sach_Hoa_Don_Toan_Bo.xlsx";
            }
        }

        String encodedFileName = URLEncoder.encode(rawFileName, StandardCharsets.UTF_8).replace("+", "%20");

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + rawFileName + "\"; filename*=UTF-8''" + encodedFileName)
                .contentType(MediaType.parseMediaType(EXCEL_CONTENT_TYPE))
                .body(excelBytes);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegal(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    }
}
