package com.homestayManagement.homestayManagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "applied_penalties")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppliedPenalty {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "check_record_id", nullable = false)
    private CheckInRecord checkRecord;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rules_penalty_id", nullable = false)
    private RulesPenalty rulesPenalty;

    @Column(name = "actual_fine", nullable = false, precision = 10, scale = 2)
    private BigDecimal actualFine;

    @Column(length = 255)
    private String description;
}
