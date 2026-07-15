package com.homestayManagement.homestayManagement.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "ai_agent_configs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiAgentConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "agent_name", length = 50)
    private String agentName;

    @Column(name = "system_prompt", columnDefinition = "TEXT")
    private String systemPrompt;

    @Column(length = 50)
    private String provider;

    @Column(name = "model_name", length = 100)
    private String modelName;

    @Column(name = "default_tone", length = 100)
    private String defaultTone;

    @Column(name = "brand_voice", columnDefinition = "TEXT")
    private String brandVoice;

    @Column(name = "hashtag_rules", columnDefinition = "TEXT")
    private String hashtagRules;

    @Column(name = "cta_rules", columnDefinition = "TEXT")
    private String ctaRules;

    @Column(name = "posting_interval_hours")
    private Integer postingIntervalHours;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;
}
