package com.homestayManagement.homestayManagement.controller;

import com.homestayManagement.homestayManagement.dto.response.AdminInvoiceResponse;
import com.homestayManagement.homestayManagement.service.AdminInvoiceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/invoices")
public class AdminInvoiceController {

    private final AdminInvoiceService adminInvoiceService;

    public AdminInvoiceController(AdminInvoiceService adminInvoiceService) {
        this.adminInvoiceService = adminInvoiceService;
    }

    @GetMapping
    public List<AdminInvoiceResponse> getAllInvoices() {
        return adminInvoiceService.getAllInvoices();
    }

    @GetMapping("/{id}")
    public AdminInvoiceResponse getInvoice(@PathVariable Long id) {
        return adminInvoiceService.getInvoice(id);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegal(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    }
}
