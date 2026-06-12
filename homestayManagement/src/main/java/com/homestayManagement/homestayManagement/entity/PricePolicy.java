package com.homestayManagement.homestayManagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalTime;

/**
 * Bảng 26: price_policies
 * Định nghĩa các gói/luật thuê phòng do Admin tạo.
 * Ví dụ: Thuê qua đêm, Thuê theo giờ, Combo 3h, Combo 5h, Thuê nhiều ngày.
 */
@Entity
@Table(name = "price_policies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PricePolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Tên gói thuê hiển thị lên giao diện React.
     * Ví dụ: "Thuê qua đêm", "Thuê theo giờ", "Combo 3 giờ", "Thuê nhiều ngày".
     */
    @Column(name = "policy_name", nullable = false, length = 50)
    private String policyName;

    /**
     * Bản chất loại hình để Spring Boot tính toán logic giá.
     * Các giá trị hợp lệ: OVERNIGHT, HOURLY, COMBO, DAILY
     */
    @Column(name = "rent_type", nullable = false, length = 20)
    private String rentType;

    /**
     * Giờ nhận phòng tiêu chuẩn quy định cho gói này.
     * Ví dụ: Gói Qua đêm → 19:00:00. Có thể null nếu gói không cố định giờ.
     */
    @Column(name = "standard_check_in")
    private LocalTime standardCheckIn;

    /**
     * Giờ trả phòng tiêu chuẩn quy định cho gói này.
     * Ví dụ: Gói Qua đêm → 11:00:00. Có thể null nếu gói không cố định giờ.
     */
    @Column(name = "standard_check_out")
    private LocalTime standardCheckOut;

    /**
     * Giới hạn số giờ áp dụng, chỉ dùng cho gói COMBO.
     * Ví dụ: Combo 3h → 3, Combo 5h → 5. Null nếu không phải gói COMBO.
     */
    @Column(name = "limit_hours")
    private Integer limitHours;
}
