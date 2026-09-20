package com.homestayManagement.homestayManagement.controller;

import com.homestayManagement.homestayManagement.dto.request.*;
import com.homestayManagement.homestayManagement.dto.response.*;
import com.homestayManagement.homestayManagement.service.PublicBookingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

import com.homestayManagement.homestayManagement.dto.request.CustomerRoomChangeRequest;
import com.homestayManagement.homestayManagement.entity.Booking;
import com.homestayManagement.homestayManagement.entity.BookingDetail;
import com.homestayManagement.homestayManagement.entity.MarketingNotification;
import com.homestayManagement.homestayManagement.repository.BookingRepository;
import com.homestayManagement.homestayManagement.repository.BookingDetailRepository;
import com.homestayManagement.homestayManagement.repository.MarketingNotificationRepository;
import java.time.LocalDateTime;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/bookings")
public class PublicBookingController {

    private final PublicBookingService publicBookingService;
    private final BookingRepository bookingRepository;
    private final BookingDetailRepository bookingDetailRepository;
    private final MarketingNotificationRepository marketingNotificationRepository;

    public PublicBookingController(
            PublicBookingService publicBookingService,
            BookingRepository bookingRepository,
            BookingDetailRepository bookingDetailRepository,
            MarketingNotificationRepository marketingNotificationRepository
    ) {
        this.publicBookingService = publicBookingService;
        this.bookingRepository = bookingRepository;
        this.bookingDetailRepository = bookingDetailRepository;
        this.marketingNotificationRepository = marketingNotificationRepository;
    }

    @PostMapping("/request-room-change-public")
    public ResponseEntity<Map<String, Object>> requestRoomChangePublic(@Valid @RequestBody CustomerRoomChangeRequest request) {
        String code = request.bookingCode().trim();
        Booking booking = bookingRepository.findAll().stream()
                .filter(b -> code.equalsIgnoreCase(b.getBookingCode()) || String.valueOf(b.getId()).equals(code))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy mã đơn đặt phòng [" + code + "]"));

        List<BookingDetail> details = bookingDetailRepository.findByBookingId(booking.getId());
        String customerName = booking.getCustomer() != null ? booking.getCustomer().getFullName() : "Khách hàng";
        String roomNumbers = details.stream()
                .map(d -> d.getRoom() != null ? String.valueOf(d.getRoom().getRoomNumber()) : "N/A")
                .collect(Collectors.joining(", "));
        if (roomNumbers.isBlank()) roomNumbers = "N/A";

        String reasonText = request.reason();
        if ("NOISE".equalsIgnoreCase(reasonText)) reasonText = "Phòng ồn ào";
        else if ("FACILITY_ISSUE".equalsIgnoreCase(reasonText) || "ROOM_ISSUE".equalsIgnoreCase(reasonText)) reasonText = "Sự cố thiết bị phòng";
        else if ("UPGRADE_VIEW".equalsIgnoreCase(reasonText) || "CUSTOMER_UPGRADE".equalsIgnoreCase(reasonText)) reasonText = "Muốn nâng hạng/Đổi view";
        else if ("BED_TYPE".equalsIgnoreCase(reasonText)) reasonText = "Muốn đổi loại giường";

        String noteContent = request.note() != null && !request.note().isBlank() ? " (" + request.note().trim() + ")" : "";
        String prefType = request.preferredRoomTypeName() != null && !request.preferredRoomTypeName().isBlank() ? " [Muốn sang: " + request.preferredRoomTypeName().trim() + "]" : "";

        String contactPhone = (request.phone() != null && !request.phone().isBlank())
                ? request.phone().trim()
                : (booking.getCustomer() != null && booking.getCustomer().getPhone() != null ? booking.getCustomer().getPhone() : "Chưa có");

        String notificationTitle = "🛎️ Khách yêu cầu Đổi phòng (" + customerName + " - P." + roomNumbers + ")";
        String notificationContent = "Khách " + customerName + " (SĐT: " + contactPhone + ") gửi yêu cầu đổi phòng " + roomNumbers + ". Lý do: " + reasonText + noteContent + prefType;

        MarketingNotification notif = MarketingNotification.builder()
                .platform("SYSTEM")
                .type("ROOM_CHANGE_REQUEST")
                .title(notificationTitle)
                .message(notificationContent)
                .actorName(customerName)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();
        marketingNotificationRepository.save(notif);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Yêu cầu đổi phòng của quý khách đã được gửi đến Lễ tân & Quản lý homestay. Nhân viên sẽ hỗ trợ quý khách ngay!"
        ));
    }

    @GetMapping("/price-policies")
    public List<PricePolicyResponse> getPricePolicies() {
        return publicBookingService.getPricePolicies();
    }

    @GetMapping("/services")
    public List<PublicServiceOptionResponse> getServiceOptions() {
        return publicBookingService.getServiceOptions();
    }

    @GetMapping("/my")
    public List<PublicBookingHistoryResponse> getMyBookings(Authentication authentication) {
        return publicBookingService.getMyBookings(authentication.getName());
    }

    @GetMapping("/my/{bookingId}")
    public PublicBookingHistoryDetailResponse getMyBookingDetail(
            Authentication authentication,
            @PathVariable Long bookingId
    ) {
        return publicBookingService.getMyBookingDetail(authentication.getName(), bookingId);
    }

    @PostMapping("/my/{bookingId}/confirm")
    public PublicBookingHistoryDetailResponse confirmMyBooking(
            Authentication authentication,
            @PathVariable Long bookingId
    ) {
        return publicBookingService.confirmMyBooking(authentication.getName(), bookingId);
    }

    @PostMapping("/my/{bookingId}/feedback")
    public PublicBookingHistoryDetailResponse submitMyBookingFeedback(
            Authentication authentication,
            @PathVariable Long bookingId,
            @Valid @RequestBody PublicBookingFeedbackRequest request
    ) {
        return publicBookingService.submitMyBookingFeedback(authentication.getName(), bookingId, request);
    }

    @PostMapping("/my/{bookingId}/check-extension")
    public PublicBookingExtensionCheckResponse checkExtension(
            Authentication authentication,
            @PathVariable Long bookingId,
            @RequestBody PublicBookingExtensionCheckRequest request
    ) {
        return publicBookingService.checkExtension(authentication.getName(), bookingId, request);
    }

    @PostMapping("/my/{bookingId}/extend")
    public PublicBookingHistoryDetailResponse extendStay(
            Authentication authentication,
            @PathVariable Long bookingId,
            @RequestBody PublicBookingExtendRequest request
    ) {
        return publicBookingService.extendStay(authentication.getName(), bookingId, request);
    }

    @GetMapping("/my/{bookingId}/cancel-policy-preview")
    public PublicBookingCancelPolicyPreviewResponse getCancelPolicyPreview(
            Authentication authentication,
            @PathVariable Long bookingId
    ) {
        return publicBookingService.getCancelPolicyPreview(authentication.getName(), bookingId);
    }

    @PostMapping("/my/{bookingId}/cancel")
    public PublicBookingHistoryDetailResponse cancelMyBooking(
            Authentication authentication,
            @PathVariable Long bookingId,
            @Valid @RequestBody PublicBookingCancelRequest request
    ) {
        return publicBookingService.cancelMyBooking(authentication.getName(), bookingId, request);
    }

    @PostMapping
    public PublicBookingResponse createBooking(
            Authentication authentication,
            @Valid @RequestBody PublicCreateBookingRequest request
    ) {
        String authenticatedEmail = authentication != null
                && authentication.isAuthenticated()
                && !(authentication instanceof AnonymousAuthenticationToken)
                ? authentication.getName()
                : null;
        return publicBookingService.createBooking(authenticatedEmail, request);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegal(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(error -> error.getDefaultMessage())
                .orElse("Dữ liệu không hợp lệ");
        return ResponseEntity.badRequest().body(Map.of("message", message));
    }
}
