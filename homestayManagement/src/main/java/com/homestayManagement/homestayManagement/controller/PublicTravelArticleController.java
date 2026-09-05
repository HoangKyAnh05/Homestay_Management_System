package com.homestayManagement.homestayManagement.controller;

import com.homestayManagement.homestayManagement.dto.response.TravelArticleResponse;
import com.homestayManagement.homestayManagement.service.TravelArticleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/public/travel-articles")
@RequiredArgsConstructor
public class PublicTravelArticleController {

    private final TravelArticleService travelArticleService;

    @GetMapping
    public List<TravelArticleResponse> getPublicArticles() {
        return travelArticleService.getPublicActiveArticles();
    }

    @GetMapping("/{idOrKey}")
    public TravelArticleResponse getArticleDetail(@PathVariable String idOrKey) {
        return travelArticleService.getArticleByIdOrKey(idOrKey);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegal(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    }
}
