package com.homestayManagement.homestayManagement.dto.dailyreport;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OccupiedRoomItemDto {
    private Long roomId;
    private String roomNumber;
    private String roomTypeName;
    private String customerName;
    private String customerPhone;
    private String bookingCode;
    private LocalDateTime actualCheckIn;
    private LocalDateTime expectedCheckOut;
    private Integer guestCount;
    private BigDecimal depositAmount;      // Tiền cọc / Đã thanh toán
    private BigDecimal totalRoomAmount;    // Tổng tiền phòng
    private BigDecimal remainingAmount;    // Tiền còn lại
    private String paymentStatus;          // Trạng thái thanh toán
}
