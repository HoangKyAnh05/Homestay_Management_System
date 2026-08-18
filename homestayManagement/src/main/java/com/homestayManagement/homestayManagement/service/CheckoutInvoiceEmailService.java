package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.email.CheckoutInvoiceEmailSnapshot;

public interface CheckoutInvoiceEmailService {
    CheckoutInvoiceEmailSnapshot buildSnapshot(Long invoiceId);
}
