package com.homestayManagement.homestayManagement.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "roles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 20)
    private String name; // Ví dụ: "ROLE_ADMIN", "ROLE_CUSTOMER", "ROLE_RECEPTIONIST", v.v.

    @Column(length = 200)
    private String description;
}