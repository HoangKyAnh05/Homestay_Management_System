package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.TravelArticle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TravelArticleRepository extends JpaRepository<TravelArticle, Long> {

    List<TravelArticle> findByIsActiveTrueOrderBySortOrderAscIdAsc();

    List<TravelArticle> findAllByOrderBySortOrderAscIdAsc();

    Optional<TravelArticle> findByArticleKey(String articleKey);
}
