package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.request.RulesPenaltyRequest;
import com.homestayManagement.homestayManagement.dto.response.RulesPenaltyResponse;

import java.util.List;

public interface AdminRulesPenaltyService {
    List<RulesPenaltyResponse> getAllRulesPenalties();
    RulesPenaltyResponse createRulesPenalty(RulesPenaltyRequest request);
    RulesPenaltyResponse updateRulesPenalty(Long id, RulesPenaltyRequest request);
    void deleteRulesPenalty(Long id);
}
