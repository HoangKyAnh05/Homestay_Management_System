package com.homestayManagement.homestayManagement.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
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

    @JsonProperty("isWishlisted")
    private boolean isWishlisted;

    private String message;

    @JsonProperty("wishlisted")
    public boolean getWishlisted() {
        return isWishlisted;
    }
}
