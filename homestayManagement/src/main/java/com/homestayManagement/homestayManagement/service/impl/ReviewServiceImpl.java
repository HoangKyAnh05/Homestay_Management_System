package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.CreateReviewRequestDto;
import com.homestayManagement.homestayManagement.dto.ReviewResponseDto;
import com.homestayManagement.homestayManagement.entity.*;
import com.homestayManagement.homestayManagement.repository.*;
import com.homestayManagement.homestayManagement.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final BookingDetailRepository bookingDetailRepository;
    private final AccountRepository accountRepository;
    private final CustomerRepository customerRepository;
    private final RoomTypeRepository roomTypeRepository;
    private final com.homestayManagement.homestayManagement.config.ReviewDataSeeder reviewDataSeeder;

    @Override
    @Transactional
    public ReviewResponseDto createReview(CreateReviewRequestDto request, String userEmail) {
        Account account = accountRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay tai khoan nguoi dung"));

        Customer customer = customerRepository.findByAccountId(account.getId())
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay thong tin khach hang"));

        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay don dat phong"));

        // Check ownership
        if (!booking.getCustomer().getId().equals(customer.getId())) {
            throw new IllegalArgumentException("Ban khong co quyen danh gia don dat phong nay");
        }

        // Check booking status - must be CHECKED_OUT or COMPLETED
        String status = booking.getStatus();
        if (!"CHECKED_OUT".equalsIgnoreCase(status) && !"COMPLETED".equalsIgnoreCase(status)) {
            throw new IllegalArgumentException("Ban chi co the danh gia sau khi hoan thanh ky nghỉ (CHECKED_OUT/COMPLETED)");
        }

        // Check if review already exists for this booking
        if (reviewRepository.existsByBooking(booking)) {
            throw new IllegalArgumentException("Don dat phong nay da duoc danh gia truoc do");
        }

        // Find RoomType from BookingDetail
        List<BookingDetail> details = bookingDetailRepository.findByBookingId(booking.getId());
        if (details.isEmpty()) {
            throw new IllegalArgumentException("Khong tim thay chi tiet phong cho don dat phong này");
        }
        RoomType roomType = details.get(0).getRoomType();

        // Create and save review
        String imgStr = request.getImageUrls() != null ? String.join(",", request.getImageUrls()) : null;

        Review review = Review.builder()
                .booking(booking)
                .roomType(roomType)
                .account(account)
                .ratingStars(request.getRatingStars())
                .comment(request.getComment())
                .imageUrls(imgStr)
                .status("APPROVED")
                .build();

        Review savedReview = reviewRepository.save(review);

        // Update average rating and total reviews on RoomType
        updateRoomTypeRatingStats(roomType);

        return mapToDto(savedReview);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewResponseDto> getReviewsByRoomType(Long roomTypeId) {
        RoomType roomType = roomTypeRepository.findById(roomTypeId)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay loai phong"));

        List<Review> reviews = reviewRepository.findApprovedByRoomTypeOrderByCreatedAtDesc(roomType);

        return reviews.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewResponseDto> getFeaturedReviews() {
        List<Review> reviews = reviewRepository.findFeaturedApproved();
        return reviews.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ReviewResponseDto getReviewByBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay don dat phong"));

        Review review = reviewRepository.findByBooking(booking).orElse(null);
        if (review == null) return null;

        return mapToDto(review);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewResponseDto> getAllReviews() {
        List<Review> reviews = reviewRepository.findAll();
        return reviews.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ReviewResponseDto updateReviewStatus(Long reviewId, com.homestayManagement.homestayManagement.dto.UpdateReviewStatusRequestDto request) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay danh gia ID: " + reviewId));

        String newStatus = request.getStatus();
        if (!"APPROVED".equalsIgnoreCase(newStatus) && !"HIDDEN".equalsIgnoreCase(newStatus) && !"PENDING".equalsIgnoreCase(newStatus)) {
            throw new IllegalArgumentException("Trang thai danh gia khong hop le (APPROVED, HIDDEN, PENDING)");
        }

        review.setStatus(newStatus.toUpperCase());
        Review updatedReview = reviewRepository.save(review);

        // Recalculate room type ratings
        updateRoomTypeRatingStats(updatedReview.getRoomType());

        return mapToDto(updatedReview);
    }

    @Override
    @Transactional
    public List<ReviewResponseDto> syncGoogleReviews() {
        if (reviewDataSeeder != null) {
            reviewDataSeeder.syncGoogleReviews();
        }
        return getAllReviews();
    }

    private void updateRoomTypeRatingStats(RoomType roomType) {
        Double avg = reviewRepository.findAverageRatingByRoomType(roomType);
        Integer count = reviewRepository.countByRoomType(roomType);
        
        roomType.setAverageRating(avg != null ? Math.round(avg * 10.0) / 10.0 : 5.0);
        roomType.setTotalReviews(count != null ? count : 0);
        roomTypeRepository.save(roomType);
    }

    private ReviewResponseDto mapToDto(Review review) {
        Customer cust = review.getAccount() != null ? customerRepository.findByAccountId(review.getAccount().getId()).orElse(null) : null;
        if (cust == null && review.getBooking() != null) {
            cust = review.getBooking().getCustomer();
        }
        String name = cust != null && cust.getFullName() != null && !cust.getFullName().isBlank() ? cust.getFullName() : "Khách hàng";
        String avatar = cust != null ? (cust.getAvatarUrl() != null && !cust.getAvatarUrl().isBlank() ? cust.getAvatarUrl() : cust.getGoogleAvatarUrl()) : null;

        return ReviewResponseDto.builder()
                .reviewId(review.getId())
                .bookingId(review.getBooking().getId())
                .roomTypeId(review.getRoomType().getId())
                .roomTypeName(review.getRoomType().getName())
                .customerName(name)
                .customerAvatar(avatar)
                .ratingStars(review.getRatingStars())
                .comment(review.getComment())
                .status(review.getStatus() != null ? review.getStatus() : "APPROVED")
                .imageUrls(parseImages(review.getImageUrls()))
                .createdAt(review.getCreatedAt())
                .build();
    }

    private List<String> parseImages(String imageUrlsStr) {
        if (imageUrlsStr == null || imageUrlsStr.isBlank()) return java.util.Collections.emptyList();
        return java.util.Arrays.stream(imageUrlsStr.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }
}
