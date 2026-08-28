package com.homestayManagement.homestayManagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "customers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", unique = true)
    private Account account;

    @Column(length = 50)
    private String email;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(length = 10)
    private String phone;

    @Column(length = 255)
    private String address;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(name = "google_avatar_url", length = 500)
    private String googleAvatarUrl;

    @Column(name = "avatar_source", length = 20)
    private String avatarSource;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "identity_document_number", length = 30)
    private String identityDocumentNumber;

    @Builder.Default
    @Column(name = "member_points", nullable = false)
    private Integer memberPoints = 0;

    @Builder.Default
    @Column(name = "member_discount_percent", nullable = false, precision = 5, scale = 2)
    private BigDecimal memberDiscountPercent = BigDecimal.ZERO;
}
