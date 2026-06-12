package com.homestayManagement.homestayManagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * Bảng 27: room_price_configs
 * Ma trận cấu hình giá chi tiết — bảng trung tâm lưu số tiền Admin thiết lập
 * cho từng kịch bản (loại phòng × gói thuê × loại ngày).
 *
 * Ví dụ một dòng: Phòng Deluxe + Gói Qua đêm + Thứ 7 → 700.000đ
 */
@Entity
@Table(
    name = "room_price_configs",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uq_room_price_config",
            columnNames = {"room_type_id", "price_policy_id", "day_type"}
        )
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomPriceConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Áp dụng cho loại phòng nào.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_type_id", nullable = false)
    private RoomType roomType;

    /**
     * Áp dụng cho gói thuê nào.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "price_policy_id", nullable = false)
    private PricePolicy pricePolicy;

    /**
     * Loại ngày áp dụng giá này.
     * Các giá trị hợp lệ: WEEKDAY (ngày thường), WEEKEND (thứ 7 / chủ nhật)
     */
    @Column(name = "day_type", nullable = false, length = 20)
    private String dayType;

    /**
     * Số tiền cấu hình cho kịch bản này.
     * Ví dụ: 500000, 700000, 30000...
     */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;
}
