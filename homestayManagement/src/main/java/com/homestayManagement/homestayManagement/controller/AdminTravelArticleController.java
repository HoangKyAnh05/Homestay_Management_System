package com.homestayManagement.homestayManagement.controller;

import com.homestayManagement.homestayManagement.dto.request.TravelArticleRequest;
import com.homestayManagement.homestayManagement.dto.response.TravelArticleResponse;
import com.homestayManagement.homestayManagement.service.TravelArticleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/travel-articles")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_STAFF', 'ADMIN', 'STAFF', 'ROLE_MARKETING', 'MARKETING')")
public class AdminTravelArticleController {

    private final TravelArticleService travelArticleService;

    @GetMapping
    public ResponseEntity<List<TravelArticleResponse>> getAllArticles() {
        return ResponseEntity.ok(travelArticleService.getAllArticlesForAdmin());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TravelArticleResponse> getArticleDetail(@PathVariable Long id) {
        return ResponseEntity.ok(travelArticleService.getArticleByIdOrKey(String.valueOf(id)));
    }

    @PostMapping
    public ResponseEntity<TravelArticleResponse> createArticle(@Valid @RequestBody TravelArticleRequest request) {
        return ResponseEntity.ok(travelArticleService.createArticle(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TravelArticleResponse> updateArticle(
            @PathVariable Long id,
            @Valid @RequestBody TravelArticleRequest request
    ) {
        return ResponseEntity.ok(travelArticleService.updateArticle(id, request));
    }

    @PutMapping("/{id}/toggle-status")
    public ResponseEntity<TravelArticleResponse> toggleArticleStatus(@PathVariable Long id) {
        return ResponseEntity.ok(travelArticleService.toggleArticleStatus(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteArticle(@PathVariable Long id) {
        travelArticleService.deleteArticle(id);
        return ResponseEntity.ok(Map.of("message", "Đã xóa bài viết thành công"));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegal(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    }
}
