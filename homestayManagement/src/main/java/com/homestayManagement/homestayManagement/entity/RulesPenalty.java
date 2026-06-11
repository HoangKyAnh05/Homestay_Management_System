package com.homestayManagement.homestayManagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "rules_penalties")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RulesPenalty {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(name = "penalty_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal penaltyAmount;
}
