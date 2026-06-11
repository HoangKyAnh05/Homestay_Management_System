package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.request.RulesPenaltyRequest;
import com.homestayManagement.homestayManagement.dto.response.RulesPenaltyResponse;
import com.homestayManagement.homestayManagement.entity.RulesPenalty;
import com.homestayManagement.homestayManagement.repository.AppliedPenaltyRepository;
import com.homestayManagement.homestayManagement.repository.RulesPenaltyRepository;
import com.homestayManagement.homestayManagement.service.AdminRulesPenaltyService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AdminRulesPenaltyServiceImpl implements AdminRulesPenaltyService {

    private final RulesPenaltyRepository rulesPenaltyRepository;
    private final AppliedPenaltyRepository appliedPenaltyRepository;

    public AdminRulesPenaltyServiceImpl(
            RulesPenaltyRepository rulesPenaltyRepository,
            AppliedPenaltyRepository appliedPenaltyRepository
    ) {
        this.rulesPenaltyRepository = rulesPenaltyRepository;
        this.appliedPenaltyRepository = appliedPenaltyRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<RulesPenaltyResponse> getAllRulesPenalties() {
        return rulesPenaltyRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public RulesPenaltyResponse createRulesPenalty(RulesPenaltyRequest request) {
        RulesPenalty rulesPenalty = RulesPenalty.builder()
                .title(request.title().trim())
                .penaltyAmount(request.penaltyAmount())
                .build();
        return toResponse(rulesPenaltyRepository.save(rulesPenalty));
    }

    @Override
    @Transactional
    public RulesPenaltyResponse updateRulesPenalty(Long id, RulesPenaltyRequest request) {
        RulesPenalty rulesPenalty = getRulesPenaltyById(id);
        rulesPenalty.setTitle(request.title().trim());
        rulesPenalty.setPenaltyAmount(request.penaltyAmount());
        return toResponse(rulesPenaltyRepository.save(rulesPenalty));
    }

    @Override
    @Transactional
    public void deleteRulesPenalty(Long id) {
        if (!rulesPenaltyRepository.existsById(id)) {
            throw new IllegalArgumentException("Không tìm thấy nội quy/phạt");
        }
        if (appliedPenaltyRepository.existsByRulesPenaltyId(id)) {
            throw new IllegalArgumentException("Không thể xoá nội quy đã phát sinh phạt");
        }
        rulesPenaltyRepository.deleteById(id);
    }

    private RulesPenalty getRulesPenaltyById(Long id) {
        return rulesPenaltyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy nội quy/phạt"));
    }

    private RulesPenaltyResponse toResponse(RulesPenalty rulesPenalty) {
        return new RulesPenaltyResponse(
                rulesPenalty.getId(),
                rulesPenalty.getTitle(),
                rulesPenalty.getPenaltyAmount()
        );
    }
}
