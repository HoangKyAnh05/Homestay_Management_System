package com.homestayManagement.homestayManagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "deposit_policies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DepositPolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "policy_name", nullable = false, length = 50)
    private String policyName;

    @Column(name = "calculation_type", nullable = false, length = 20)
    private String calculationType;

    @Column(name = "policy_value", nullable = false, precision = 10, scale = 2)
    private BigDecimal policyValue;

    @Column(length = 255)
    private String description;
}
