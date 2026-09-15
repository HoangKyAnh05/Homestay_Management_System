package com.homestayManagement.homestayManagement.controller;

import com.homestayManagement.homestayManagement.dto.CreateReviewRequestDto;
import com.homestayManagement.homestayManagement.dto.ReviewResponseDto;
import com.homestayManagement.homestayManagement.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/customer/reviews")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ROLE_CUSTOMER')")
public class CustomerReviewController {

    private final ReviewService reviewService;

    @PostMapping
    public ResponseEntity<ReviewResponseDto> createReview(
            @Valid @RequestBody CreateReviewRequestDto request,
            Authentication authentication
    ) {
        String email = authentication.getName();
        return ResponseEntity.status(HttpStatus.CREATED).body(reviewService.createReview(request, email));
    }

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<ReviewResponseDto> getReviewByBooking(@PathVariable Long bookingId) {
        return ResponseEntity.ok(reviewService.getReviewByBooking(bookingId));
    }

    @PutMapping("/{reviewId}")
    public ResponseEntity<ReviewResponseDto> updateReview(
            @PathVariable Long reviewId,
            @Valid @RequestBody com.homestayManagement.homestayManagement.dto.UpdateCustomerReviewRequestDto request,
            Authentication authentication
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(reviewService.updateReview(reviewId, request, email));
    }

    @PutMapping("/booking/{bookingId}")
    public ResponseEntity<ReviewResponseDto> updateReviewByBooking(
            @PathVariable Long bookingId,
            @Valid @RequestBody com.homestayManagement.homestayManagement.dto.UpdateCustomerReviewRequestDto request,
            Authentication authentication
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(reviewService.updateReviewByBooking(bookingId, request, email));
    }
}
