package com.homestayManagement.homestayManagement.dto.giveaway;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GiveawayPostPublishRequest {

    private Long socialAccountId;

    @NotBlank(message = "Tiêu đề bài viết không được để trống")
    private String title;

    @NotBlank(message = "Nội dung bài viết không được để trống")
    private String content;

    private String giveawayUrl;

    private List<String> hashtags;

    private List<String> imageUrls;
}
