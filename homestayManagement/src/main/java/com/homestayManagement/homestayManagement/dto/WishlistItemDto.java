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
public class WishlistItemDto {
    private Long wishlistId;
    private Long roomTypeId;
    private String roomTypeName;
    private String description;
    private Integer maxAdults;
    private Integer maxChildren;
    private Double averageRating;
    private Integer totalReviews;
    private String primaryImageUrl;
    private java.util.List<String> imageUrls;
    private LocalDateTime addedAt;

}
