package com.homestayManagement.homestayManagement.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "room_amenities_usage")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomAmenitiesUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "check_in_record_id", nullable = false)
    private CheckInRecord checkInRecord;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private RoomMiniBarItem item;

    @Column(name = "quantity_used", nullable = false)
    private Integer quantityUsed;
}
