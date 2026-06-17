package com.homestayManagement.homestayManagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "booking_guests",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uq_booking_guest_identity",
                        columnNames = {"booking_detail_id", "identity_document_number"}
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingGuest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_detail_id", nullable = false)
    private BookingDetail bookingDetail;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Builder.Default
    @Column(name = "identity_document_type", nullable = false, length = 20)
    private String identityDocumentType = "CCCD";

    @Column(name = "identity_document_number", nullable = false, length = 30)
    private String identityDocumentNumber;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(length = 20)
    private String gender;

    @Builder.Default
    @Column(nullable = false, length = 50)
    private String nationality = "VIETNAM";

    @Column(length = 15)
    private String phone;

    @Column(length = 100)
    private String email;

    @Column(length = 255)
    private String address;

    @Builder.Default
    @Column(name = "is_primary_guest", nullable = false)
    private boolean primaryGuest = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verified_by_employee_id")
    private Employee verifiedBy;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(columnDefinition = "TEXT")
    private String note;

    @PrePersist
    protected void onCreate() {
        if (verifiedAt == null) {
            verifiedAt = LocalDateTime.now();
        }
    }
}
