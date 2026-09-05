package com.homestayManagement.homestayManagement.dto.giveaway;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GiveawaySpinResponse {

    private int targetIndex;
    private String prizeName;
    private String prizeCode;
    private int discountPercent;
    private String congratulationsMessage;
    private String voucherExpiry;
    private ContactDetails contact;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ContactDetails {
        private String hotline;
        private String zalo;
        private String facebookUrl;
        private String address;
    }
}
