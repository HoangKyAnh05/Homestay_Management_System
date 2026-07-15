package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record MarketingOptionRequest(
        @NotBlank @Pattern(regexp = "GOAL|TONE") String optionType,
        @NotBlank @Size(max = 120) String label
) {
}
