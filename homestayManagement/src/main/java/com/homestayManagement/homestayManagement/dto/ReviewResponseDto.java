package com.homestayManagement.homestayManagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewResponseDto {
    private Long reviewId;
    private Long bookingId;
    private Long roomTypeId;
    private String roomTypeName;
    private String customerName;
    private String customerAvatar;
    private Integer ratingStars;
    private String comment;
    private String status;
    private java.util.List<String> imageUrls;
    private LocalDateTime createdAt;
}

