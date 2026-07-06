package com.homestayManagement.homestayManagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "stay_accesses",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_stay_access_booking_detail", columnNames = "booking_detail_id"),
                @UniqueConstraint(name = "uk_stay_access_check_in_record", columnNames = "check_in_record_id")
        },
        indexes = {
                @Index(name = "idx_stay_access_account_status", columnList = "account_id,status")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StayAccess {

    public static final String INVITED = "INVITED";
    public static final String ACTIVE = "ACTIVE";
    public static final String EXPIRED = "EXPIRED";
    public static final String REVOKED = "REVOKED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_detail_id", nullable = false, unique = true)
    private BookingDetail bookingDetail;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "check_in_record_id", nullable = false, unique = true)
    private CheckInRecord checkInRecord;

    @Column(name = "representative_name", nullable = false, length = 100)
    private String representativeName;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "invited_at", nullable = false)
    private LocalDateTime invitedAt;

    @Column(name = "activated_at")
    private LocalDateTime activatedAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @PrePersist
    protected void onCreate() {
        if (invitedAt == null) {
            invitedAt = LocalDateTime.now();
        }
    }
}
