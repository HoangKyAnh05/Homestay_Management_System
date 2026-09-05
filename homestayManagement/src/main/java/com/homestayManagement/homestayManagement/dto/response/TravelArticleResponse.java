package com.homestayManagement.homestayManagement.dto.response;

import com.homestayManagement.homestayManagement.entity.TravelArticle;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TravelArticleResponse {

    private Long id;
    private String articleKey;
    private String title;
    private String subtitle;
    private String tag;
    private String category;
    private String readTime;
    private String author;
    private String dateTag;
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
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static TravelArticleResponse fromEntity(TravelArticle entity) {
        if (entity == null) return null;
        return TravelArticleResponse.builder()
                .id(entity.getId())
                .articleKey(entity.getArticleKey())
                .title(entity.getTitle())
                .subtitle(entity.getSubtitle())
                .tag(entity.getTag())
                .category(entity.getCategory())
                .readTime(entity.getReadTime())
                .author(entity.getAuthor())
                .dateTag(entity.getDateTag())
                .coverImageUrl(entity.getCoverImageUrl())
                .rating(entity.getRating())
                .location(entity.getLocation())
                .distance(entity.getDistance())
                .bestTime(entity.getBestTime())
                .cost(entity.getCost())
                .highlightsJson(entity.getHighlightsJson())
                .intro(entity.getIntro())
                .sectionsJson(entity.getSectionsJson())
                .homestayAdvice(entity.getHomestayAdvice())
                .sortOrder(entity.getSortOrder())
                .isActive(entity.getIsActive())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
