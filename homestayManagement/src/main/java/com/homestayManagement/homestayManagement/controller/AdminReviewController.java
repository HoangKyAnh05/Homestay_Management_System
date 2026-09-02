package com.homestayManagement.homestayManagement.controller;

import com.homestayManagement.homestayManagement.dto.ReviewResponseDto;
import com.homestayManagement.homestayManagement.dto.UpdateReviewStatusRequestDto;
import com.homestayManagement.homestayManagement.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/reviews")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_STAFF', 'ADMIN', 'STAFF')")
public class AdminReviewController {

    private final ReviewService reviewService;

    @GetMapping
    public ResponseEntity<List<ReviewResponseDto>> getAllReviews() {
        return ResponseEntity.ok(reviewService.getAllReviews());
    }

    @PutMapping("/{reviewId}/status")
    public ResponseEntity<ReviewResponseDto> updateReviewStatus(
            @PathVariable Long reviewId,
            @Valid @RequestBody UpdateReviewStatusRequestDto request
    ) {
        return ResponseEntity.ok(reviewService.updateReviewStatus(reviewId, request));
    }

    @PostMapping("/sync-google")
    public ResponseEntity<List<ReviewResponseDto>> syncGoogleReviews() {
        return ResponseEntity.ok(reviewService.syncGoogleReviews());
    }
}
