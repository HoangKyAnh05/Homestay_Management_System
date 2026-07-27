package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record MarketingPostRequest(
        Long campaignId,
        @NotBlank @Size(max = 160) String title,
        @NotBlank @Size(max = 2000) String brief,
        @Size(max = 300) String targetAudience,
        @NotBlank @Size(max = 100) String goal,
        @NotBlank @Size(max = 100) String tone,
        @Size(max = 30) String contentLength,
        @NotEmpty @Valid List<MarketingChannelRequest> channels,
        @Valid List<MarketingMediaRequest> media
) {
}
