package com.homestayManagement.homestayManagement.dto.dailyreport;

import lombok.*;

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
}
