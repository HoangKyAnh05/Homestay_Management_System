package com.homestayManagement.homestayManagement.dto.giveaway;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GiveawayStatsResponse {

    private long totalInteractions;
    private long newLeadsCount;
    private long contactedCount;
    private long bookedCount;
    private long todayLeadsCount;
    private long topPrizesWon; // 50% prizes
}
