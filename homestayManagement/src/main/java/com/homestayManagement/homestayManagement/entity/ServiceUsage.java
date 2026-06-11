package com.homestayManagement.homestayManagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "service_usages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "check_in_record_id", nullable = false)
    private CheckInRecord checkInRecord;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "facility_service_id")
    private FacilityService facilityService;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inventory_service_id")
    private InventoryService inventoryService;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "price_at_use", nullable = false, precision = 10, scale = 2)
    private BigDecimal priceAtUse;
}
