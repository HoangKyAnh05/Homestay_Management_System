package com.homestayManagement.homestayManagement.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "room_types")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    // base_price đã được loại bỏ — giá được quản lý động trong bảng room_price_configs

    @Column(name = "max_adults", nullable = false)
    private Integer maxAdults;

    @Column(name = "max_children", nullable = false)
    private Integer maxChildren;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deposit_policy_id")
    private DepositPolicy depositPolicy;

    @Column(columnDefinition = "TEXT")
    private String description;
}
