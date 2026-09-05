package com.homestayManagement.homestayManagement.dto.giveaway;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GiveawayLeadResponse {

    private Long id;
    private String fullName;
    private String phone;
    private String email;
    private String travelPlan;
    private String notes;
    private String prizeName;
    private String prizeCode;
    private Integer discountPercent;
    private String status;
    private String staffNote;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
