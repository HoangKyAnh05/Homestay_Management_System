package com.homestayManagement.homestayManagement.entity;


import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "user_details")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDetail {
    @Id
    private Long userId; // Sử dụng Shared Primary Key liên kết 1-1 thẳng sang bảng User

    @OneToOne
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(length = 15)
    private String phone;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(length = 255)
    private String address;

    @Column(name = "avatar_url", length = 255)
    private String avatarUrl; // Link lưu ảnh avatar (đưa lên Cloudinary theo thiết kế của bạn)

    @Column(name = "cccd_number", length = 12)
    private String cccdNumber; // Số CCCD để check-in/xác minh danh tính

    @Column(name = "cccd_image_url", length = 255)
    private String cccdImageUrl; // Link ảnh CCCD lưu trên Cloudinary
}
