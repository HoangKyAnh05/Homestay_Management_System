package com.homestayManagement.homestayManagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "employees")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false, unique = true)
    private Account account;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(length = 15)
    private String phone;

    @Column(length = 255)
    private String address;

    @Column(name = "avatar_url", length = 255)
    private String avatarUrl;

    @Builder.Default
    @Column(length = 20)
    private String status = "WORKING";

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;
}
