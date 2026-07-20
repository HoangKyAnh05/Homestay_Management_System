package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.constraints.NotBlank;

public record MarketingChannelContentRequest(
        @NotBlank String content,
        String hashtags
) {
}
