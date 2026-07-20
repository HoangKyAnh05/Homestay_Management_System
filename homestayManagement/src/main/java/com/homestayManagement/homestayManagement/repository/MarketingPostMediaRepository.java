package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.MarketingPostMedia;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MarketingPostMediaRepository extends JpaRepository<MarketingPostMedia, Long> {
    List<MarketingPostMedia> findByPostIdOrderByDisplayOrderAsc(Long postId);
    void deleteByPostId(Long postId);
}
