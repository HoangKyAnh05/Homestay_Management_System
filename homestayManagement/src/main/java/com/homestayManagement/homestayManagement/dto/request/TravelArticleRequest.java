package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TravelArticleRequest {

    private String articleKey;

    @NotBlank(message = "Tiêu đề bài viết không được để trống")
    private String title;

    private String subtitle;
    private String tag;
    private String category;
    private String readTime;
    private String author;
    private String dateTag;

    @NotBlank(message = "Ảnh bìa bài viết không được để trống")
    private String coverImageUrl;

    private String rating;
    private String location;
    private String distance;
    private String bestTime;
    private String cost;
    private String highlightsJson;
    private String intro;
    private String sectionsJson;
    private String homestayAdvice;
    private Integer sortOrder;
    private Boolean isActive;
}
