package com.homestayManagement.homestayManagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "booking_details")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_type_id", nullable = false)
    private RoomType roomType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    private Room room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by_employee_id")
    private Employee assignedBy;

    @Column(name = "check_in_target", nullable = false)
    private LocalDateTime checkInTarget;

    @Column(name = "check_out_target", nullable = false)
    private LocalDateTime checkOutTarget;

    @Column(name = "number_of_adults", nullable = false)
    private Integer numberOfAdults;

    @Column(name = "number_of_children", nullable = false)
    private Integer numberOfChildren;

    @Column(name = "price_at_booking", nullable = false, precision = 10, scale = 2)
    private BigDecimal priceAtBooking;

    @Column(name = "rent_type", nullable = false, length = 20)
    private String rentType;

    @Builder.Default
    @Column(name = "room_assignment_status", nullable = false, length = 20)
    private String roomAssignmentStatus = "UNASSIGNED";

    @Column(name = "assigned_at")
    private LocalDateTime assignedAt;

    @Builder.Default
    @Column(nullable = false, length = 20)
    private String status = "CONFIRMED";
}
