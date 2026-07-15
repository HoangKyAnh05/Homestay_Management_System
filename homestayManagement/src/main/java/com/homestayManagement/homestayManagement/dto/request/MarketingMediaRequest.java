package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MarketingMediaRequest(
        @NotBlank @Size(max = 500) String mediaUrl,
        @NotBlank @Size(max = 20) String mediaType,
        Integer displayOrder,
        @Size(max = 255) String altText,
        @Size(max = 30) String source
) {
}
