package com.homestayManagement.homestayManagement.controller;

import com.homestayManagement.homestayManagement.dto.ReviewResponseDto;
import com.homestayManagement.homestayManagement.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/public/reviews")
@RequiredArgsConstructor
public class PublicReviewController {

    private final ReviewService reviewService;

    @GetMapping
    public ResponseEntity<List<ReviewResponseDto>> getAllPublicReviews() {
        return ResponseEntity.ok(reviewService.getFeaturedReviews());
    }

    @GetMapping("/featured")
    public ResponseEntity<List<ReviewResponseDto>> getFeaturedReviews() {
        return ResponseEntity.ok(reviewService.getFeaturedReviews());
    }

    @GetMapping("/room-type/{roomTypeId}")
    public ResponseEntity<List<ReviewResponseDto>> getReviewsByRoomType(@PathVariable Long roomTypeId) {
        return ResponseEntity.ok(reviewService.getReviewsByRoomType(roomTypeId));
    }
}
