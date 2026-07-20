package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MarketingSocialAuthStartRequest(
        @NotBlank @Size(max = 30) String platform,
        @Size(max = 500) String callbackUrl,
        @Size(max = 500) String redirectUri,
        @Size(max = 120) String groupId
) {
}
