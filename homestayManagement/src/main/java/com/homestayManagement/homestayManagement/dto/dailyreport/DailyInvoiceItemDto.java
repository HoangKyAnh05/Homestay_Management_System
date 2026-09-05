package com.homestayManagement.homestayManagement.dto.dailyreport;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyInvoiceItemDto {
    private Long invoiceId;
    private String bookingCode;
    private String customerName;
    private BigDecimal amount;
    private String paymentMethod;
    private LocalDateTime createdAt;
}
