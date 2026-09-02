package com.homestayManagement.homestayManagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WishlistToggleResponseDto {
    private Long roomTypeId;
    private boolean isWishlisted;
    private String message;
}
