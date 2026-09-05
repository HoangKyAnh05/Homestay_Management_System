package com.homestayManagement.homestayManagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "travel_articles", indexes = {
        @Index(name = "idx_travel_articles_active", columnList = "is_active"),
        @Index(name = "idx_travel_articles_sort", columnList = "sort_order")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TravelArticle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "article_key", length = 100, unique = true)
    private String articleKey;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String subtitle;

    @Column(length = 100)
    private String tag;

    @Column(length = 100)
    private String category;

    @Column(name = "read_time", length = 50)
    private String readTime;

    @Column(length = 100)
    private String author;

    @Column(name = "date_tag", length = 100)
    private String dateTag;

    @Column(name = "cover_image_url", columnDefinition = "TEXT")
    private String coverImageUrl;

    @Column(length = 100)
    private String rating;

    @Column(length = 300)
    private String location;

    @Column(length = 300)
    private String distance;

    @Column(name = "best_time", length = 200)
    private String bestTime;

    @Column(length = 200)
    private String cost;

    @Column(name = "highlights_json", columnDefinition = "TEXT")
    private String highlightsJson;

    @Column(columnDefinition = "TEXT")
    private String intro;

    @Column(name = "sections_json", columnDefinition = "LONGTEXT")
    private String sectionsJson;

    @Column(name = "homestay_advice", columnDefinition = "TEXT")
    private String homestayAdvice;

    @Builder.Default
    @Column(name = "sort_order")
    private Integer sortOrder = 0;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.isActive == null) this.isActive = true;
        if (this.sortOrder == null) this.sortOrder = 0;
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
