package com.homestayManagement.homestayManagement.dto.email;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record CheckoutInvoiceEmailSnapshot(
        Long invoiceId,
        String invoiceName,
        String invoiceSymbol,
        String invoiceTemplateSymbol,
        String invoiceNumber,
        String sellerName,
        String sellerAddress,
        String sellerTaxCode,
        String sellerPhone,
        String sellerWebsite,
        String sellerAccountNo,
        String sellerBankName,
        String buyerName,
        String buyerEmail,
        String buyerAddress,
        String bookingCode,
        LocalDateTime issuedAt,
        String taxAuthorityCode,
        BigDecimal roomCharge,
        BigDecimal serviceCharge,
        BigDecimal penaltyCharge,
        BigDecimal taxableAmount,
        BigDecimal vatRate,
        BigDecimal vatAmount,
        BigDecimal totalAmount,
        List<CheckoutInvoiceEmailLine> lines
) {
}
