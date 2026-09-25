package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.CreateReviewRequestDto;
import com.homestayManagement.homestayManagement.dto.ReviewResponseDto;
import com.homestayManagement.homestayManagement.entity.*;
import com.homestayManagement.homestayManagement.repository.*;
import com.homestayManagement.homestayManagement.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;
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
    public String uploadReviewImage(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File ảnh không hợp lệ hoặc đang trống");
        }
        String contentType = file.getContentType();
        if (contentType != null && !contentType.toLowerCase().startsWith("image/")) {
            throw new IllegalArgumentException("Chỉ chấp nhận file định dạng hình ảnh (JPG, PNG, WEBP, GIF)");
        }
        Path uploadDir = Paths.get("uploads").toAbsolutePath().normalize();
        Files.createDirectories(uploadDir);
        String originalName = file.getOriginalFilename();
        String ext = (originalName != null && originalName.contains("."))
                ? originalName.substring(originalName.lastIndexOf("."))
                : ".jpg";
        String filename = "review-" + UUID.randomUUID() + ext;
        Path target = uploadDir.resolve(filename).normalize();
        file.transferTo(target);
        return "/uploads/" + filename;
    }

    private boolean isCustomerBookingOwner(Booking booking, Account account, Customer customer, String userEmail) {
        if (booking == null) return false;
        if (customer != null && booking.getCustomer() != null && booking.getCustomer().getId().equals(customer.getId())) {
            return true;
        }
        if (account != null && booking.getCustomer() != null && booking.getCustomer().getAccount() != null
                && booking.getCustomer().getAccount().getId().equals(account.getId())) {
            return true;
        }
        if (userEmail != null && booking.getCustomer() != null && booking.getCustomer().getEmail() != null
                && booking.getCustomer().getEmail().equalsIgnoreCase(userEmail.trim())) {
            return true;
        }
        if (account != null && account.getEmail() != null && userEmail != null
                && account.getEmail().equalsIgnoreCase(userEmail.trim())) {
            return true;
        }
        return false;
    }

    @Override
    @Transactional
    public ReviewResponseDto createReview(CreateReviewRequestDto request, String userEmail) {
        Account account = accountRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài khoản người dùng"));

        Customer customer = customerRepository.findByAccountId(account.getId()).orElse(null);

        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn đặt phòng"));

        // Check ownership
        if (!isCustomerBookingOwner(booking, account, customer, userEmail)) {
            throw new IllegalArgumentException("Bạn không có quyền đánh giá đơn đặt phòng này");
        }

        // Check booking status - must be CHECKED_OUT or COMPLETED
        String status = booking.getStatus();
        if (!"CHECKED_OUT".equalsIgnoreCase(status) && !"COMPLETED".equalsIgnoreCase(status)) {
            throw new IllegalArgumentException("Bạn chỉ có thể đánh giá sau khi hoàn thành kỳ nghỉ (CHECKED_OUT/COMPLETED)");
        }

        // Check if review already exists for this booking -> If so, update it gracefully
        Review existing = reviewRepository.findByBooking(booking).orElse(null);
        if (existing != null) {
            String imgStr = request.getImageUrls() != null ? String.join(",", request.getImageUrls()) : null;
            existing.setRatingStars(request.getRatingStars());
            existing.setComment(request.getComment());
            existing.setImageUrls(imgStr);
            existing.setStatus("APPROVED");
            Review updated = reviewRepository.save(existing);
            updateRoomTypeRatingStats(updated.getRoomType());
            return mapToDto(updated);
        }

        // Find RoomType from BookingDetail
        List<BookingDetail> details = bookingDetailRepository.findByBookingId(booking.getId());
        if (details.isEmpty()) {
            throw new IllegalArgumentException("Không tìm thấy chi tiết phòng cho đơn đặt phòng này");
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
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy loại phòng"));

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
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn đặt phòng"));

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
    public ReviewResponseDto updateReview(Long reviewId, com.homestayManagement.homestayManagement.dto.UpdateCustomerReviewRequestDto request, String userEmail) {
        Account account = accountRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài khoản người dùng"));

        Customer customer = customerRepository.findByAccountId(account.getId()).orElse(null);

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đánh giá ID: " + reviewId));

        boolean isOwner = (review.getAccount() != null && review.getAccount().getId().equals(account.getId()))
                || (review.getBooking() != null && isCustomerBookingOwner(review.getBooking(), account, customer, userEmail));

        if (!isOwner) {
            throw new IllegalArgumentException("Bạn không có quyền chỉnh sửa đánh giá này");
        }

        String imgStr = request.getImageUrls() != null ? String.join(",", request.getImageUrls()) : null;
        review.setRatingStars(request.getRatingStars());
        review.setComment(request.getComment());
        review.setImageUrls(imgStr);
        review.setStatus("APPROVED");

        Review updated = reviewRepository.save(review);
        updateRoomTypeRatingStats(updated.getRoomType());

        return mapToDto(updated);
    }

    @Override
    @Transactional
    public ReviewResponseDto updateReviewByBooking(Long bookingId, com.homestayManagement.homestayManagement.dto.UpdateCustomerReviewRequestDto request, String userEmail) {
        Account account = accountRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài khoản người dùng"));

        Customer customer = customerRepository.findByAccountId(account.getId()).orElse(null);

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn đặt phòng ID: " + bookingId));

        if (!isCustomerBookingOwner(booking, account, customer, userEmail)) {
            throw new IllegalArgumentException("Bạn không có quyền chỉnh sửa đánh giá đơn đặt phòng này");
        }

        Review review = reviewRepository.findByBooking(booking).orElse(null);
        String imgStr = request.getImageUrls() != null ? String.join(",", request.getImageUrls()) : null;

        if (review == null) {
            List<BookingDetail> details = bookingDetailRepository.findByBookingId(booking.getId());
            if (details.isEmpty()) {
                throw new IllegalArgumentException("Không tìm thấy chi tiết phòng cho đơn đặt phòng này");
            }
            RoomType roomType = details.get(0).getRoomType();

            review = Review.builder()
                    .booking(booking)
                    .roomType(roomType)
                    .account(account)
                    .ratingStars(request.getRatingStars())
                    .comment(request.getComment())
                    .imageUrls(imgStr)
                    .status("APPROVED")
                    .build();
        } else {
            review.setRatingStars(request.getRatingStars());
            review.setComment(request.getComment());
            review.setImageUrls(imgStr);
            review.setStatus("APPROVED");
        }

        Review updated = reviewRepository.save(review);
        updateRoomTypeRatingStats(updated.getRoomType());

        return mapToDto(updated);
    }


    @Override
    @Transactional
    public ReviewResponseDto updateReviewStatus(Long reviewId, com.homestayManagement.homestayManagement.dto.UpdateReviewStatusRequestDto request) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đánh giá ID: " + reviewId));

        String newStatus = request.getStatus();
        if (!"APPROVED".equalsIgnoreCase(newStatus) && !"HIDDEN".equalsIgnoreCase(newStatus) && !"PENDING".equalsIgnoreCase(newStatus)) {
            throw new IllegalArgumentException("Trạng thái đánh giá không hợp lệ (APPROVED, HIDDEN, PENDING)");
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

        String bCode = null;
        if (review.getBooking() != null) {
            bCode = review.getBooking().getBookingCode() != null && !review.getBooking().getBookingCode().isBlank()
                    ? review.getBooking().getBookingCode()
                    : "BK_" + review.getBooking().getId();
        }

        return ReviewResponseDto.builder()
                .reviewId(review.getId())
                .bookingId(review.getBooking() != null ? review.getBooking().getId() : null)
                .bookingCode(bCode)
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
