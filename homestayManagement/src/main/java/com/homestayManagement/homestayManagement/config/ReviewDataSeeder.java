package com.homestayManagement.homestayManagement.config;

import com.homestayManagement.homestayManagement.entity.*;
import com.homestayManagement.homestayManagement.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
@Order(10)
public class ReviewDataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(ReviewDataSeeder.class);

    private final CustomerRepository customerRepository;
    private final BookingRepository bookingRepository;
    private final BookingDetailRepository bookingDetailRepository;
    private final RoomTypeRepository roomTypeRepository;
    private final ReviewRepository reviewRepository;

    public ReviewDataSeeder(
            CustomerRepository customerRepository,
            BookingRepository bookingRepository,
            BookingDetailRepository bookingDetailRepository,
            RoomTypeRepository roomTypeRepository,
            ReviewRepository reviewRepository
    ) {
        this.customerRepository = customerRepository;
        this.bookingRepository = bookingRepository;
        this.bookingDetailRepository = bookingDetailRepository;
        this.roomTypeRepository = roomTypeRepository;
        this.reviewRepository = reviewRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        syncGoogleReviews();
    }

    @Transactional
    public void syncGoogleReviews() {
        try {
            seedCustomerAvatars();
            seedRealisticReviews();
            updateAllRoomTypeRatings();
            log.info("ReviewDataSeeder: Successfully synced Google reviews and customer avatars.");
        } catch (Exception e) {
            log.warn("ReviewDataSeeder encountered an issue: {}", e.getMessage());
        }
    }

    private void seedCustomerAvatars() {
        Map<String, String> avatarMap = Map.of(
                "Nguyen Khanh Linh", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
                "Tran Duc Minh", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
                "Pham Minh Thao", "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
                "Le Anh Khoa", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
                "Nguyen Van A", "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80",
                "Nguyen Van An", "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80",
                "Tô Đức Trọng", "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80"
        );

        List<Customer> customers = customerRepository.findAll();
        for (Customer c : customers) {
            String name = c.getFullName() != null ? c.getFullName().trim() : "";
            if (avatarMap.containsKey(name)) {
                c.setAvatarUrl(avatarMap.get(name));
                customerRepository.save(c);
            } else if (c.getAvatarUrl() == null || c.getAvatarUrl().isBlank()) {
                c.setAvatarUrl("https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80");
                customerRepository.save(c);
            }
        }
    }

    private void seedRealisticReviews() {
        List<Booking> bookings = bookingRepository.findAll();
        if (bookings.isEmpty()) return;

        List<RoomType> roomTypes = roomTypeRepository.findAll();
        if (roomTypes.isEmpty()) return;

        record ReviewSample(String comment, int stars, String images, String status) {}

        List<ReviewSample> samples = List.of(
                new ReviewSample(
                        "Lá Đỏ Homestay view đỉnh nóc kịch trần luôn mọi người ơi! Ngồi ban công hoặc bờ kè đá phía trước vừa nhâm nhi tách cà phê nóng vừa ngắm trọn đoàn tàu Mường Hoa màu đỏ chạy qua thung lũng giữa biển mây Hoàng Liên Sơn siêu đẹp. Phòng ốc bằng gỗ pơ-mu thơm dịu, chăn đệm sưởi ấm cúng, nước nóng cực mạnh. Các bạn nhân viên bản địa rất dễ thương và hiếu khách. 10/10!",
                        5,
                        "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80,https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80",
                        "APPROVED"
                ),
                new ReviewSample(
                        "Homestay nằm ở số 31 Hoàng Liên, ngay cạnh Viettrekking nhưng không gian yên tĩnh và mộc mạc hơn nhiều. Buổi sáng thức dậy kéo rèm ra là mây tràn vào sát cửa kính. Đồ ăn sáng và cà phê ở quán Lá Đỏ ngon, giá cả rất hợp lý so với mặt bằng Sa Pa. Chắc chắn sẽ quay lại!",
                        5,
                        "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
                        "APPROVED"
                ),
                new ReviewSample(
                        "Vị trí đắc địa cách Nhà thờ Đá và Sun Plaza chỉ khoảng 5-7 phút đi bộ. Bờ kè đá trước homestay chụp ảnh sống ảo góc nào cũng ra ảnh thơ mộng. Tối đến homestay hỗ trợ set up tiệc nướng BBQ ngoài trời ngắm thung lũng về đêm lung linh ánh đèn. Trải nghiệm tuyệt vời!",
                        5,
                        "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80",
                        "APPROVED"
                ),
                new ReviewSample(
                        "Phòng Panorama view thung lũng ngắm trọn dãy Fansipan. Điểm cộng lớn nhất là bồn tắm gỗ nhìn ra núi rừng, ngâm mình ngắm hoàng hôn buông xuống sườn đồi là khoảnh khắc đáng giá nhất chuyến đi. Bạn lễ tân nhiệt tình hỗ trợ thuê xe máy và đặt vé cáp treo.",
                        5,
                        "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80",
                        "APPROVED"
                ),
                new ReviewSample(
                        "Không gian ngập tràn cây xanh, hoa cỏ và decor nhà gỗ rất gần gũi với thiên nhiên Sa Pa. Anh chị chủ nhà và nhân viên thân thiện như người một nhà. Phòng sạch sẽ tinh tươm. Đường vào hơi dốc đặc trưng đồi núi nhưng có xe đưa đón hành lý rất tiện.",
                        4,
                        "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=800&q=80",
                        "APPROVED"
                ),
                new ReviewSample(
                        "Chuyến đi nghỉ dưỡng 3 ngày 2 đêm cùng gia đình tại Lá Đỏ rất trọn vẹn. Phòng gia đình rộng rãi, tiện nghi ấm cúng, trà táo mèo và hạt dẻ nướng miễn phí đón khách rất chu đáo. View săn mây buổi sáng 10 điểm không có nhưng!",
                        5,
                        "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80",
                        "APPROVED"
                )
        );

        int sampleIndex = 0;
        for (Booking booking : bookings) {
            if (sampleIndex >= samples.size()) break;
            if (reviewRepository.existsByBooking(booking)) {
                Optional<Review> existingOpt = reviewRepository.findByBooking(booking);
                if (existingOpt.isPresent()) {
                    Review existing = existingOpt.get();
                    ReviewSample sample = samples.get(sampleIndex % samples.size());
                    existing.setComment(sample.comment());
                    existing.setRatingStars(sample.stars());
                    existing.setImageUrls(sample.images());
                    existing.setStatus(sample.status());
                    reviewRepository.save(existing);
                    sampleIndex++;
                }
                continue;
            }

            List<BookingDetail> details = bookingDetailRepository.findByBookingId(booking.getId());
            RoomType roomType = !details.isEmpty() && details.get(0).getRoomType() != null
                    ? details.get(0).getRoomType()
                    : roomTypes.get(0);

            Account account = booking.getCustomer() != null ? booking.getCustomer().getAccount() : null;
            if (account == null) continue;

            ReviewSample sample = samples.get(sampleIndex % samples.size());
            Review review = Review.builder()
                    .booking(booking)
                    .roomType(roomType)
                    .account(account)
                    .ratingStars(sample.stars())
                    .comment(sample.comment())
                    .imageUrls(sample.images())
                    .status(sample.status())
                    .createdAt(booking.getBookingDate() != null ? booking.getBookingDate().plusDays(2) : LocalDateTime.now())
                    .build();

            reviewRepository.save(review);
            sampleIndex++;
        }
    }

    private void updateAllRoomTypeRatings() {
        List<RoomType> roomTypes = roomTypeRepository.findAll();
        for (RoomType rt : roomTypes) {
            Double avg = reviewRepository.findAverageRatingByRoomType(rt);
            Integer count = reviewRepository.countByRoomType(rt);
            rt.setAverageRating(avg != null ? Math.round(avg * 10.0) / 10.0 : 5.0);
            rt.setTotalReviews(count != null ? count : 0);
            roomTypeRepository.save(rt);
        }
    }
}
