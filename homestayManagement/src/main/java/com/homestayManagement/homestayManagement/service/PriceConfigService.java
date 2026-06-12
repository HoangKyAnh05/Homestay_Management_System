package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.request.PricePolicyRequest;
import com.homestayManagement.homestayManagement.dto.request.RoomPriceConfigRequest;
import com.homestayManagement.homestayManagement.dto.response.PricePolicyResponse;
import com.homestayManagement.homestayManagement.dto.response.RoomPriceConfigResponse;

import java.util.List;

public interface PriceConfigService {

    // ── PricePolicy ──────────────────────────────────────

    List<PricePolicyResponse> getAllPolicies();

    PricePolicyResponse createPolicy(PricePolicyRequest request);

    PricePolicyResponse updatePolicy(Long id, PricePolicyRequest request);

    void deletePolicy(Long id);

    // ── RoomPriceConfig ──────────────────────────────────

    List<RoomPriceConfigResponse> getAllConfigs();

    List<RoomPriceConfigResponse> getConfigsByRoomType(Long roomTypeId);

    RoomPriceConfigResponse createConfig(RoomPriceConfigRequest request);

    RoomPriceConfigResponse updateConfig(Long id, RoomPriceConfigRequest request);

    void deleteConfig(Long id);
}
