package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.giveaway.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface GiveawayService {

    GiveawayConfigResponse getConfig();

    String registerSpin(GiveawayRegisterSpinRequest request, String ipAddress);

    GiveawaySpinResponse spin(GiveawaySpinRequest request);

    Page<GiveawayLeadResponse> getLeads(String search, String status, Pageable pageable);

    GiveawayLeadResponse updateLeadStatus(Long id, GiveawayLeadUpdateStatusRequest request);

    GiveawayStatsResponse getStats();

    byte[] exportLeadsToExcel();

    void publishGiveawayPost(GiveawayPostPublishRequest request);
}
