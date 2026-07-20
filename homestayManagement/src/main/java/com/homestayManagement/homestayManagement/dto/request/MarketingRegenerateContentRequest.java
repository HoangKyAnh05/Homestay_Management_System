package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MarketingRegenerateContentRequest(
        @NotBlank @Size(max = 1000) String instruction
) {
}
