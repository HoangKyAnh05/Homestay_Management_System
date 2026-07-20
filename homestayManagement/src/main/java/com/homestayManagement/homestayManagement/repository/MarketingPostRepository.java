package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.MarketingPost;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MarketingPostRepository extends JpaRepository<MarketingPost, Long> {
    List<MarketingPost> findTop50ByOrderByCreatedAtDesc();
    long countByStatus(String status);
}
