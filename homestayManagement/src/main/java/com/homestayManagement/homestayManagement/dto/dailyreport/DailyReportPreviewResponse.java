package com.homestayManagement.homestayManagement.dto.dailyreport;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyReportPreviewResponse {
    private LocalDate reportDate;
    private int occupiedRoomsCount;
    private int checkInTodayCount;
    private int checkOutTodayCount;
    private BigDecimal cashRevenue;
    private BigDecimal transferRevenue;
    private BigDecimal totalRevenue;
    private List<OccupiedRoomItemDto> occupiedRooms;
    private List<DailyInvoiceItemDto> invoices;
    private boolean alreadySubmitted;
    private Long existingReportId;
    private String existingReportStatus;
}
