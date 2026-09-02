package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.CreateReviewRequestDto;
import com.homestayManagement.homestayManagement.dto.ReviewResponseDto;
import com.homestayManagement.homestayManagement.dto.UpdateReviewStatusRequestDto;

import java.util.List;

public interface ReviewService {
    ReviewResponseDto createReview(CreateReviewRequestDto request, String userEmail);
    List<ReviewResponseDto> getReviewsByRoomType(Long roomTypeId);
    ReviewResponseDto getReviewByBooking(Long bookingId);
    List<ReviewResponseDto> getAllReviews();
    ReviewResponseDto updateReviewStatus(Long reviewId, UpdateReviewStatusRequestDto request);
}

