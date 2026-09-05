package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.request.TravelArticleRequest;
import com.homestayManagement.homestayManagement.dto.response.TravelArticleResponse;

import java.util.List;

public interface TravelArticleService {

    List<TravelArticleResponse> getPublicActiveArticles();

    TravelArticleResponse getArticleByIdOrKey(String idOrKey);

    List<TravelArticleResponse> getAllArticlesForAdmin();

    TravelArticleResponse createArticle(TravelArticleRequest request);

    TravelArticleResponse updateArticle(Long id, TravelArticleRequest request);

    void deleteArticle(Long id);

    TravelArticleResponse toggleArticleStatus(Long id);
}
