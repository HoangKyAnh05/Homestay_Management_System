package com.homestayManagement.homestayManagement.dto.giveaway;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GiveawayConfigResponse {

    private String campaignTitle;
    private String campaignSubtitle;
    private String homestayName;
    private String hotline;
    private String zaloNumber;
    private String facebookMessengerUrl;
    private String address;
    private List<PrizeOption> prizes;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PrizeOption {
        private int index;
        private String name;
        private String codePrefix;
        private int discountPercent;
        private String color;
        private String icon;
        private String badge;
    }
}
