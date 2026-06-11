package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.response.AdminInvoiceResponse;

import java.util.List;

public interface AdminInvoiceService {
    List<AdminInvoiceResponse> getAllInvoices();
    AdminInvoiceResponse getInvoice(Long id);
}
