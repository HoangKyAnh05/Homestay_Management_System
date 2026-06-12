package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.response.AdminBookingCheckInResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminBookingCustomerResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminBookingDetailResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminBookingInvoiceSummaryResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminBookingRoomResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminBookingScheduleItemResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminBookingScheduleResponse;
import com.homestayManagement.homestayManagement.dto.request.AdminBookingAddMiniBarRequest;
import com.homestayManagement.homestayManagement.dto.request.AdminBookingAddPenaltyRequest;
import com.homestayManagement.homestayManagement.dto.request.AdminBookingAddServiceRequest;
import com.homestayManagement.homestayManagement.dto.response.FacilityServiceResponse;
import com.homestayManagement.homestayManagement.dto.response.InventoryServiceResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminInvoicePenaltyItemResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminInvoiceServiceItemResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminPaymentResponse;
import com.homestayManagement.homestayManagement.dto.response.RoomMiniBarItemResponse;
import com.homestayManagement.homestayManagement.dto.response.RulesPenaltyResponse;
import com.homestayManagement.homestayManagement.entity.AppliedPenalty;
import com.homestayManagement.homestayManagement.entity.Booking;
import com.homestayManagement.homestayManagement.entity.BookingDetail;
import com.homestayManagement.homestayManagement.entity.CheckInRecord;
import com.homestayManagement.homestayManagement.entity.Customer;
import com.homestayManagement.homestayManagement.entity.FacilityService;
import com.homestayManagement.homestayManagement.entity.Invoice;
import com.homestayManagement.homestayManagement.entity.InventoryService;
import com.homestayManagement.homestayManagement.entity.Payment;
import com.homestayManagement.homestayManagement.entity.Room;
import com.homestayManagement.homestayManagement.entity.RoomAmenitiesUsage;
import com.homestayManagement.homestayManagement.entity.RoomMiniBarItem;
import com.homestayManagement.homestayManagement.entity.RulesPenalty;
import com.homestayManagement.homestayManagement.entity.ServiceUsage;
import com.homestayManagement.homestayManagement.repository.AppliedPenaltyRepository;
import com.homestayManagement.homestayManagement.repository.BookingDetailRepository;
import com.homestayManagement.homestayManagement.repository.CheckInRecordRepository;
import com.homestayManagement.homestayManagement.repository.FacilityServiceRepository;
import com.homestayManagement.homestayManagement.repository.InvoiceRepository;
import com.homestayManagement.homestayManagement.repository.InventoryServiceRepository;
import com.homestayManagement.homestayManagement.repository.PaymentRepository;
import com.homestayManagement.homestayManagement.repository.RoomAmenitiesUsageRepository;
import com.homestayManagement.homestayManagement.repository.RoomMiniBarItemRepository;
import com.homestayManagement.homestayManagement.repository.RoomRepository;
import com.homestayManagement.homestayManagement.repository.RulesPenaltyRepository;
import com.homestayManagement.homestayManagement.repository.ServiceUsageRepository;
import com.homestayManagement.homestayManagement.service.AdminBookingService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class AdminBookingServiceImpl implements AdminBookingService {

    private final BookingDetailRepository bookingDetailRepository;
    private final RoomRepository roomRepository;
    private final CheckInRecordRepository checkInRecordRepository;
    private final ServiceUsageRepository serviceUsageRepository;
    private final RoomAmenitiesUsageRepository roomAmenitiesUsageRepository;
    private final AppliedPenaltyRepository appliedPenaltyRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final FacilityServiceRepository facilityServiceRepository;
    private final InventoryServiceRepository inventoryServiceRepository;
    private final RoomMiniBarItemRepository roomMiniBarItemRepository;
    private final RulesPenaltyRepository rulesPenaltyRepository;

    public AdminBookingServiceImpl(
            BookingDetailRepository bookingDetailRepository,
            RoomRepository roomRepository,
            CheckInRecordRepository checkInRecordRepository,
            ServiceUsageRepository serviceUsageRepository,
            RoomAmenitiesUsageRepository roomAmenitiesUsageRepository,
            AppliedPenaltyRepository appliedPenaltyRepository,
            InvoiceRepository invoiceRepository,
            PaymentRepository paymentRepository,
            FacilityServiceRepository facilityServiceRepository,
            InventoryServiceRepository inventoryServiceRepository,
            RoomMiniBarItemRepository roomMiniBarItemRepository,
            RulesPenaltyRepository rulesPenaltyRepository
    ) {
        this.bookingDetailRepository = bookingDetailRepository;
        this.roomRepository = roomRepository;
        this.checkInRecordRepository = checkInRecordRepository;
        this.serviceUsageRepository = serviceUsageRepository;
        this.roomAmenitiesUsageRepository = roomAmenitiesUsageRepository;
        this.appliedPenaltyRepository = appliedPenaltyRepository;
        this.invoiceRepository = invoiceRepository;
        this.paymentRepository = paymentRepository;
        this.facilityServiceRepository = facilityServiceRepository;
        this.inventoryServiceRepository = inventoryServiceRepository;
        this.roomMiniBarItemRepository = roomMiniBarItemRepository;
        this.rulesPenaltyRepository = rulesPenaltyRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public AdminBookingScheduleResponse getWeeklySchedule(LocalDate weekStart) {
        LocalDate normalizedWeekStart = normalizeWeekStart(weekStart);
        LocalDate weekEnd = normalizedWeekStart.plusDays(6);
        LocalDateTime startInclusive = normalizedWeekStart.atStartOfDay();
        LocalDateTime endExclusive = weekEnd.plusDays(1).atStartOfDay();

        List<AdminBookingRoomResponse> rooms = roomRepository.findAll().stream()
                .sorted(Comparator.comparing(Room::getRoomNumber, Comparator.nullsLast(String::compareToIgnoreCase)))
                .map(this::toRoomResponse)
                .toList();

        List<AdminBookingScheduleItemResponse> bookings = bookingDetailRepository
                .findOverlappingSchedule(startInclusive, endExclusive)
                .stream()
                .map(this::toScheduleItemResponse)
                .toList();

        return new AdminBookingScheduleResponse(
                normalizedWeekStart,
                weekEnd,
                LocalDate.now(),
                rooms,
                bookings
        );
    }

    @Override
    @Transactional(readOnly = true)
    public AdminBookingDetailResponse getBookingDetail(Long bookingDetailId) {
        BookingDetail detail = bookingDetailRepository.findByIdForAdminDetail(bookingDetailId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn đặt phòng"));

        Booking booking = detail.getBooking();
        Customer customer = booking.getCustomer();
        Room room = detail.getRoom();
        List<CheckInRecord> checkInRecords = checkInRecordRepository.findByBookingDetailIdForAdmin(detail.getId());
        List<AdminInvoiceServiceItemResponse> serviceItems = buildServiceItems(detail.getId());
        List<AdminInvoicePenaltyItemResponse> penaltyItems = appliedPenaltyRepository.findByBookingDetailIdForAdmin(detail.getId())
                .stream()
                .map(this::toPenaltyItemResponse)
                .toList();
        Invoice invoice = invoiceRepository.findByBookingIdForAdmin(booking.getId()).orElse(null);
        List<AdminPaymentResponse> payments = invoice == null
                ? List.of()
                : paymentRepository.findByInvoiceIdOrderByPaymentTimeDescIdDesc(invoice.getId()).stream()
                        .map(this::toPaymentResponse)
                        .toList();

        return new AdminBookingDetailResponse(
                booking.getId(),
                detail.getId(),
                booking.getBookingDate(),
                booking.getStatus(),
                detail.getStatus(),
                room.getId(),
                room.getRoomNumber(),
                room.getRoomType() != null ? room.getRoomType().getName() : null,
                detail.getCheckInTarget(),
                detail.getCheckOutTarget(),
                detail.getNumberOfAdults(),
                detail.getNumberOfChildren(),
                detail.getPriceAtBooking(),
                detail.getRentType(),
                toCustomerResponse(customer),
                checkInRecords.stream().map(this::toCheckInResponse).toList(),
                serviceItems,
                penaltyItems,
                invoice != null ? toInvoiceSummaryResponse(invoice) : null,
                payments,
                facilityServiceRepository.findAll().stream().map(this::toFacilityServiceResponse).toList(),
                inventoryServiceRepository.findAll().stream().map(this::toInventoryServiceResponse).toList(),
                roomMiniBarItemRepository.findAll().stream().map(this::toMiniBarResponse).toList(),
                rulesPenaltyRepository.findAll().stream().map(this::toRulesPenaltyResponse).toList()
        );
    }

    @Override
    @Transactional
    public AdminBookingDetailResponse checkIn(Long bookingDetailId) {
        BookingDetail detail = bookingDetailRepository.findByIdForAdminDetail(bookingDetailId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn đặt phòng"));
        if ("CANCELLED".equalsIgnoreCase(detail.getStatus()) || "CANCELLED".equalsIgnoreCase(detail.getBooking().getStatus())) {
            throw new IllegalArgumentException("Không thể check-in đơn đã hủy");
        }

        checkInRecordRepository.findByBookingDetailId(bookingDetailId).orElseGet(() -> checkInRecordRepository.save(
                CheckInRecord.builder()
                        .bookingDetail(detail)
                        .customer(detail.getBooking().getCustomer())
                        .actualCheckIn(LocalDateTime.now())
                        .earlyCheckInFee(BigDecimal.ZERO)
                        .lateCheckOutFee(BigDecimal.ZERO)
                        .build()
        ));
        detail.setStatus("CHECKED_IN");
        detail.getBooking().setStatus("CHECKED_IN");
        bookingDetailRepository.save(detail);
        return getBookingDetail(bookingDetailId);
    }

    @Override
    @Transactional
    public AdminBookingDetailResponse checkOut(Long bookingDetailId) {
        BookingDetail detail = bookingDetailRepository.findByIdForAdminDetail(bookingDetailId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn đặt phòng"));
        CheckInRecord record = checkInRecordRepository.findByBookingDetailId(bookingDetailId)
                .orElseThrow(() -> new IllegalArgumentException("Phòng này chưa check-in"));
        if (record.getActualCheckOut() == null) {
            record.setActualCheckOut(LocalDateTime.now());
            checkInRecordRepository.save(record);
        }
        detail.setStatus("COMPLETED");
        detail.getBooking().setStatus("COMPLETED");
        bookingDetailRepository.save(detail);
        return getBookingDetail(bookingDetailId);
    }

    @Override
    @Transactional
    public AdminBookingDetailResponse addService(Long bookingDetailId, AdminBookingAddServiceRequest request) {
        CheckInRecord record = requireCheckInRecord(bookingDetailId);
        String type = request.type().trim().toUpperCase();
        ServiceUsage.ServiceUsageBuilder builder = ServiceUsage.builder()
                .checkInRecord(record)
                .quantity(request.quantity());
        if ("FACILITY".equals(type)) {
            FacilityService service = facilityServiceRepository.findById(request.serviceId())
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy dịch vụ tiện ích"));
            builder.facilityService(service).priceAtUse(service.getPrice());
        } else if ("INVENTORY".equals(type)) {
            InventoryService service = inventoryServiceRepository.findById(request.serviceId())
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy dịch vụ kho"));
            builder.inventoryService(service).priceAtUse(service.getPrice());
        } else {
            throw new IllegalArgumentException("Loại dịch vụ không hợp lệ");
        }
        serviceUsageRepository.save(builder.build());
        return getBookingDetail(bookingDetailId);
    }

    @Override
    @Transactional
    public AdminBookingDetailResponse addMiniBar(Long bookingDetailId, AdminBookingAddMiniBarRequest request) {
        CheckInRecord record = requireCheckInRecord(bookingDetailId);
        RoomMiniBarItem item = roomMiniBarItemRepository.findById(request.itemId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy mini-bar"));
        roomAmenitiesUsageRepository.save(RoomAmenitiesUsage.builder()
                .checkInRecord(record)
                .item(item)
                .quantityUsed(request.quantity())
                .build());
        return getBookingDetail(bookingDetailId);
    }

    @Override
    @Transactional
    public AdminBookingDetailResponse addPenalty(Long bookingDetailId, AdminBookingAddPenaltyRequest request) {
        CheckInRecord record = requireCheckInRecord(bookingDetailId);
        RulesPenalty rulesPenalty = rulesPenaltyRepository.findById(request.rulesPenaltyId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy khoản phạt"));
        appliedPenaltyRepository.save(AppliedPenalty.builder()
                .checkRecord(record)
                .rulesPenalty(rulesPenalty)
                .actualFine(request.amount())
                .description(request.description())
                .build());
        return getBookingDetail(bookingDetailId);
    }

    private LocalDate normalizeWeekStart(LocalDate weekStart) {
        LocalDate date = weekStart != null ? weekStart : LocalDate.now();
        return date.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    }

    private AdminBookingRoomResponse toRoomResponse(Room room) {
        return new AdminBookingRoomResponse(
                room.getId(),
                room.getRoomNumber(),
                room.getRoomType() != null ? room.getRoomType().getName() : null
        );
    }

    private AdminBookingScheduleItemResponse toScheduleItemResponse(BookingDetail detail) {
        Booking booking = detail.getBooking();
        Customer customer = booking.getCustomer();
        Room room = detail.getRoom();

        return new AdminBookingScheduleItemResponse(
                booking.getId(),
                detail.getId(),
                room.getId(),
                room.getRoomNumber(),
                room.getRoomType() != null ? room.getRoomType().getName() : null,
                customer.getId(),
                customer.getFullName(),
                customer.getPhone(),
                booking.getBookingDate(),
                detail.getCheckInTarget(),
                detail.getCheckOutTarget(),
                detail.getNumberOfAdults(),
                detail.getNumberOfChildren(),
                detail.getPriceAtBooking(),
                detail.getRentType(),
                booking.getStatus(),
                detail.getStatus()
        );
    }

    private AdminBookingCustomerResponse toCustomerResponse(Customer customer) {
        return new AdminBookingCustomerResponse(
                customer.getId(),
                customer.getFullName(),
                customer.getAccount() != null ? customer.getAccount().getEmail() : null,
                customer.getPhone(),
                customer.getAddress(),
                customer.getDateOfBirth()
        );
    }

    private AdminBookingCheckInResponse toCheckInResponse(CheckInRecord record) {
        return new AdminBookingCheckInResponse(
                record.getId(),
                record.getActualCheckIn(),
                record.getActualCheckOut(),
                record.getEarlyCheckInFee(),
                record.getLateCheckOutFee(),
                record.getReceptionist() != null ? record.getReceptionist().getFullName() : null,
                record.getHousekeeping() != null ? record.getHousekeeping().getFullName() : null
        );
    }

    private List<AdminInvoiceServiceItemResponse> buildServiceItems(Long bookingDetailId) {
        List<AdminInvoiceServiceItemResponse> items = new ArrayList<>();
        serviceUsageRepository.findByBookingDetailIdForAdmin(bookingDetailId).stream()
                .map(this::toServiceItemResponse)
                .forEach(items::add);
        roomAmenitiesUsageRepository.findByBookingDetailIdForAdmin(bookingDetailId).stream()
                .map(this::toMiniBarItemResponse)
                .forEach(items::add);
        return items;
    }

    private AdminInvoiceServiceItemResponse toServiceItemResponse(ServiceUsage usage) {
        String type = usage.getFacilityService() != null ? "FACILITY" : "INVENTORY";
        String name = usage.getFacilityService() != null
                ? usage.getFacilityService().getName()
                : usage.getInventoryService().getName();
        BigDecimal totalPrice = usage.getPriceAtUse().multiply(BigDecimal.valueOf(usage.getQuantity()));
        return new AdminInvoiceServiceItemResponse(
                usage.getId(),
                type,
                name,
                usage.getQuantity(),
                usage.getPriceAtUse(),
                totalPrice
        );
    }

    private AdminInvoiceServiceItemResponse toMiniBarItemResponse(RoomAmenitiesUsage usage) {
        BigDecimal unitPrice = usage.getItem().getPrice();
        BigDecimal totalPrice = unitPrice.multiply(BigDecimal.valueOf(usage.getQuantityUsed()));
        return new AdminInvoiceServiceItemResponse(
                usage.getId(),
                "MINI_BAR",
                usage.getItem().getName(),
                usage.getQuantityUsed(),
                unitPrice,
                totalPrice
        );
    }

    private AdminInvoicePenaltyItemResponse toPenaltyItemResponse(AppliedPenalty penalty) {
        return new AdminInvoicePenaltyItemResponse(
                penalty.getId(),
                penalty.getRulesPenalty().getTitle(),
                penalty.getActualFine(),
                penalty.getDescription()
        );
    }

    private AdminBookingInvoiceSummaryResponse toInvoiceSummaryResponse(Invoice invoice) {
        return new AdminBookingInvoiceSummaryResponse(
                invoice.getId(),
                invoice.getRoomCharge(),
                invoice.getServiceCharge(),
                invoice.getPenaltyCharge(),
                invoice.getTotalAmount(),
                invoice.getCreatedAt(),
                invoice.getEmployee() != null ? invoice.getEmployee().getFullName() : null
        );
    }

    private AdminPaymentResponse toPaymentResponse(Payment payment) {
        return new AdminPaymentResponse(
                payment.getId(),
                payment.getPaymentMethod(),
                payment.getTransactionNo(),
                payment.getAmount(),
                payment.getStatus(),
                payment.getPaymentTime()
        );
    }

    private CheckInRecord requireCheckInRecord(Long bookingDetailId) {
        return checkInRecordRepository.findByBookingDetailId(bookingDetailId)
                .orElseThrow(() -> new IllegalArgumentException("Vui lòng check-in trước khi ghi nhận phát sinh"));
    }

    private FacilityServiceResponse toFacilityServiceResponse(FacilityService service) {
        return new FacilityServiceResponse(service.getId(), service.getName(), service.getPrice(), service.isActive());
    }

    private InventoryServiceResponse toInventoryServiceResponse(InventoryService service) {
        return new InventoryServiceResponse(service.getId(), service.getName(), service.getPrice(), service.getQuantityInStock());
    }

    private RoomMiniBarItemResponse toMiniBarResponse(RoomMiniBarItem item) {
        return new RoomMiniBarItemResponse(item.getId(), item.getName(), item.getPrice(), item.getQuantityInStock());
    }

    private RulesPenaltyResponse toRulesPenaltyResponse(RulesPenalty penalty) {
        return new RulesPenaltyResponse(penalty.getId(), penalty.getTitle(), penalty.getPenaltyAmount());
    }
}
