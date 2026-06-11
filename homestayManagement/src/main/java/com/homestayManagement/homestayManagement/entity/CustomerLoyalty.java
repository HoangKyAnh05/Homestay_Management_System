package com.homestayManagement.homestayManagement.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "customer_loyalty")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerLoyalty {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false, unique = true)
    private Customer customer;

    @Builder.Default
    @Column(name = "current_points", nullable = false)
    private Integer currentPoints = 0;

    @Builder.Default
    @Column(name = "total_earned_points", nullable = false)
    private Integer totalEarnedPoints = 0;
}
