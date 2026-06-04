package com.homestayManagement.homestayManagement.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String email; // Dùng email làm username đăng nhập luôn như tài liệu thiết kế

    @Column(nullable = false, length = 255)
    private String password; // Lưu password đã mã hóa (BCrypt)

    @Builder.Default
    @Column(name = "is_verified", nullable = false)
    private boolean isVerified = false; // Phục vụ luồng xác thực email (PENDING -> ACTIVE)

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private boolean isActive = true; // Admin dùng để Lock/Unlock tài khoản

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role; // Mỗi tài khoản gắn với 1 Role chính

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

