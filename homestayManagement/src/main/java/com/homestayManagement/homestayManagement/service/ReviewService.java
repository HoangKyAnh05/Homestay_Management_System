package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.CreateReviewRequestDto;
import com.homestayManagement.homestayManagement.dto.ReviewResponseDto;
import com.homestayManagement.homestayManagement.dto.UpdateReviewStatusRequestDto;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

public interface ReviewService {
    String uploadReviewImage(MultipartFile file) throws IOException;
    ReviewResponseDto createReview(CreateReviewRequestDto request, String userEmail);
    List<ReviewResponseDto> getReviewsByRoomType(Long roomTypeId);
    List<ReviewResponseDto> getFeaturedReviews();
    ReviewResponseDto getReviewByBooking(Long bookingId);
    ReviewResponseDto updateReview(Long reviewId, com.homestayManagement.homestayManagement.dto.UpdateCustomerReviewRequestDto request, String userEmail);
    ReviewResponseDto updateReviewByBooking(Long bookingId, com.homestayManagement.homestayManagement.dto.UpdateCustomerReviewRequestDto request, String userEmail);
    List<ReviewResponseDto> getAllReviews();
    ReviewResponseDto updateReviewStatus(Long reviewId, UpdateReviewStatusRequestDto request);
    List<ReviewResponseDto> syncGoogleReviews();
}


