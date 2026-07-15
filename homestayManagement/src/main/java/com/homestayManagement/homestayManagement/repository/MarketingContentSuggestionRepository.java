package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.MarketingContentSuggestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MarketingContentSuggestionRepository extends JpaRepository<MarketingContentSuggestion, Long> {
    List<MarketingContentSuggestion> findTop6ByStatusOrderByCreatedAtDesc(String status);
}
