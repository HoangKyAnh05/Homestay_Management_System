package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.request.AdminUpdateBookingCustomerRequest;
import com.homestayManagement.homestayManagement.dto.request.AdminUpdateBookingDetailRequest;
import com.homestayManagement.homestayManagement.dto.request.AdminDirectBookingRequest;
import com.homestayManagement.homestayManagement.dto.request.AdminDirectBookingGuestRequest;
import com.homestayManagement.homestayManagement.dto.response.AdminBookingCancellationResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminBookingCheckInResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminBookingCustomerResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminBookingDetailResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminCheckoutResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminBookingInvoiceSummaryResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminBookingRoomResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminBookingScheduleItemResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminBookingScheduleResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminCheckInLogBookingResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminCheckInLogDetailResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminCustomerHistoryGuestResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminDirectBookingBusySlotResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminDirectBookingRoomResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminDirectBookingResponse;
import com.homestayManagement.homestayManagement.dto.request.AdminBookingAddMiniBarRequest;
import com.homestayManagement.homestayManagement.dto.request.AdminBookingAddPenaltyRequest;
import com.homestayManagement.homestayManagement.dto.request.AdminBookingAddServiceRequest;
import com.homestayManagement.homestayManagement.dto.request.AdminCheckoutPaymentRequest;
import com.homestayManagement.homestayManagement.dto.request.AdminDirectBookingServiceRequest;
import com.homestayManagement.homestayManagement.dto.response.FacilityServiceResponse;
import com.homestayManagement.homestayManagement.dto.response.InventoryServiceResponse;
import com.homestayManagement.homestayManagement.dto.request.AdminDirectBookingRoomRequest;
import com.homestayManagement.homestayManagement.dto.response.AdminInvoicePenaltyItemResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminInvoiceServiceItemResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminPaymentResponse;
import com.homestayManagement.homestayManagement.dto.response.RoomIncidentResponse;
import com.homestayManagement.homestayManagement.dto.response.RoomMiniBarItemResponse;
import com.homestayManagement.homestayManagement.dto.response.RulesPenaltyResponse;
import com.homestayManagement.homestayManagement.dto.response.SePayPaymentResponse;
import com.homestayManagement.homestayManagement.entity.Account;
import com.homestayManagement.homestayManagement.entity.AppliedPenalty;
import com.homestayManagement.homestayManagement.entity.Booking;
import com.homestayManagement.homestayManagement.entity.BookingDetail;
import com.homestayManagement.homestayManagement.entity.BookingServiceItem;
import com.homestayManagement.homestayManagement.entity.RoomIncident;
import com.homestayManagement.homestayManagement.repository.RoomIncidentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import com.homestayManagement.homestayManagement.entity.BookingGuest;
import com.homestayManagement.homestayManagement.entity.CheckInRecord;
import com.homestayManagement.homestayManagement.entity.Customer;
import com.homestayManagement.homestayManagement.entity.DepositPolicy;
import com.homestayManagement.homestayManagement.entity.Employee;
import com.homestayManagement.homestayManagement.entity.FacilityService;
import com.homestayManagement.homestayManagement.entity.Invoice;
import com.homestayManagement.homestayManagement.entity.InventoryService;
import com.homestayManagement.homestayManagement.entity.Payment;
import com.homestayManagement.homestayManagement.entity.PricePolicy;
import com.homestayManagement.homestayManagement.entity.Role;
import com.homestayManagement.homestayManagement.entity.Room;
import com.homestayManagement.homestayManagement.entity.RoomAmenitiesUsage;
import com.homestayManagement.homestayManagement.entity.RoomMiniBarItem;
import com.homestayManagement.homestayManagement.entity.RoomPriceConfig;
import com.homestayManagement.homestayManagement.entity.RoomType;
import com.homestayManagement.homestayManagement.entity.RulesPenalty;
import com.homestayManagement.homestayManagement.entity.ServiceUsage;
import com.homestayManagement.homestayManagement.repository.AccountRepository;
import com.homestayManagement.homestayManagement.repository.AppliedPenaltyRepository;
import com.homestayManagement.homestayManagement.repository.BookingDetailRepository;
import com.homestayManagement.homestayManagement.repository.BookingGuestRepository;
import com.homestayManagement.homestayManagement.repository.BookingRepository;
import com.homestayManagement.homestayManagement.repository.BookingServiceItemRepository;
import com.homestayManagement.homestayManagement.repository.CheckInRecordRepository;
import com.homestayManagement.homestayManagement.repository.CustomerRepository;
import com.homestayManagement.homestayManagement.repository.EmployeeRepository;
import com.homestayManagement.homestayManagement.repository.FacilityServiceRepository;
import com.homestayManagement.homestayManagement.repository.InvoiceRepository;
import com.homestayManagement.homestayManagement.repository.HousekeepingTaskRepository;
import com.homestayManagement.homestayManagement.repository.InventoryServiceRepository;
import com.homestayManagement.homestayManagement.repository.PaymentRepository;
import com.homestayManagement.homestayManagement.repository.RoleRepository;
import com.homestayManagement.homestayManagement.repository.RoomAmenitiesUsageRepository;
import com.homestayManagement.homestayManagement.repository.RoomMiniBarItemRepository;
import com.homestayManagement.homestayManagement.repository.RoomRepository;
import com.homestayManagement.homestayManagement.repository.PricePolicyRepository;
import com.homestayManagement.homestayManagement.repository.RoomPriceConfigRepository;
import com.homestayManagement.homestayManagement.repository.RulesPenaltyRepository;
import com.homestayManagement.homestayManagement.repository.ServiceUsageRepository;
import com.homestayManagement.homestayManagement.service.AdminBookingService;
import com.homestayManagement.homestayManagement.service.SePayPaymentService;
import com.homestayManagement.homestayManagement.service.StayAccessService;
import com.homestayManagement.homestayManagement.service.event.CheckoutInvoiceEmailEvent;
import com.homestayManagement.homestayManagement.service.support.BookingCodeGenerator;
import com.homestayManagement.homestayManagement.service.support.BookingInventoryPolicy;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AdminBookingServiceImpl implements AdminBookingService {

    private static final Set<String> ADMIN_SCHEDULE_BOOKING_STATUSES = Set.of("CONFIRMED", "CHECKED_IN", "COMPLETED");
    private static final Set<String> CHECK_IN_LOG_BOOKING_STATUSES = Set.of("CONFIRMED", "CHECKED_IN", "COMPLETED");

    private final BookingDetailRepository bookingDetailRepository;
    private final BookingGuestRepository bookingGuestRepository;
    private final BookingRepository bookingRepository;
    private final RoomRepository roomRepository;
    private final AccountRepository accountRepository;
    private final CustomerRepository customerRepository;
    private final RoleRepository roleRepository;
    private final CheckInRecordRepository checkInRecordRepository;
    private final BookingServiceItemRepository bookingServiceItemRepository;
    private final ServiceUsageRepository serviceUsageRepository;
    private final RoomAmenitiesUsageRepository roomAmenitiesUsageRepository;
    private final AppliedPenaltyRepository appliedPenaltyRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final FacilityServiceRepository facilityServiceRepository;
    private final InventoryServiceRepository inventoryServiceRepository;
    private final RoomMiniBarItemRepository roomMiniBarItemRepository;
    private final RulesPenaltyRepository rulesPenaltyRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;
    private final PricePolicyRepository pricePolicyRepository;
    private final RoomPriceConfigRepository roomPriceConfigRepository;
    private final SePayPaymentService sePayPaymentService;
    private final HousekeepingTaskRepository housekeepingTaskRepository;
    private final BookingCodeGenerator bookingCodeGenerator;
    private final StayAccessService stayAccessService;
    private final ApplicationEventPublisher eventPublisher;
    private final RoomIncidentRepository roomIncidentRepository;

    @Autowired
    public AdminBookingServiceImpl(
            BookingDetailRepository bookingDetailRepository,
            BookingGuestRepository bookingGuestRepository,
            BookingRepository bookingRepository,
            RoomRepository roomRepository,
            AccountRepository accountRepository,
            CustomerRepository customerRepository,
            RoleRepository roleRepository,
            CheckInRecordRepository checkInRecordRepository,
            BookingServiceItemRepository bookingServiceItemRepository,
            ServiceUsageRepository serviceUsageRepository,
            RoomAmenitiesUsageRepository roomAmenitiesUsageRepository,
            AppliedPenaltyRepository appliedPenaltyRepository,
            InvoiceRepository invoiceRepository,
            PaymentRepository paymentRepository,
            FacilityServiceRepository facilityServiceRepository,
            InventoryServiceRepository inventoryServiceRepository,
            RoomMiniBarItemRepository roomMiniBarItemRepository,
            RulesPenaltyRepository rulesPenaltyRepository,
            EmployeeRepository employeeRepository,
            PasswordEncoder passwordEncoder,
            PricePolicyRepository pricePolicyRepository,
            RoomPriceConfigRepository roomPriceConfigRepository,
            SePayPaymentService sePayPaymentService,
            HousekeepingTaskRepository housekeepingTaskRepository,
            BookingCodeGenerator bookingCodeGenerator,
            StayAccessService stayAccessService,
            ApplicationEventPublisher eventPublisher,
            @Autowired(required = false) RoomIncidentRepository roomIncidentRepository
    ) {
        this.bookingDetailRepository = bookingDetailRepository;
        this.bookingGuestRepository = bookingGuestRepository;
        this.bookingRepository = bookingRepository;
        this.roomRepository = roomRepository;
        this.accountRepository = accountRepository;
        this.customerRepository = customerRepository;
        this.roleRepository = roleRepository;
        this.checkInRecordRepository = checkInRecordRepository;
        this.bookingServiceItemRepository = bookingServiceItemRepository;
        this.serviceUsageRepository = serviceUsageRepository;
        this.roomAmenitiesUsageRepository = roomAmenitiesUsageRepository;
        this.appliedPenaltyRepository = appliedPenaltyRepository;
        this.invoiceRepository = invoiceRepository;
        this.paymentRepository = paymentRepository;
        this.facilityServiceRepository = facilityServiceRepository;
        this.inventoryServiceRepository = inventoryServiceRepository;
        this.roomMiniBarItemRepository = roomMiniBarItemRepository;
        this.rulesPenaltyRepository = rulesPenaltyRepository;
        this.employeeRepository = employeeRepository;
        this.passwordEncoder = passwordEncoder;
        this.pricePolicyRepository = pricePolicyRepository;
        this.roomPriceConfigRepository = roomPriceConfigRepository;
        this.sePayPaymentService = sePayPaymentService;
        this.housekeepingTaskRepository = housekeepingTaskRepository;
        this.bookingCodeGenerator = bookingCodeGenerator;
        this.stayAccessService = stayAccessService;
        this.eventPublisher = eventPublisher;
        this.roomIncidentRepository = roomIncidentRepository;
    }

    public AdminBookingServiceImpl(
            BookingDetailRepository bookingDetailRepository,
            BookingGuestRepository bookingGuestRepository,
            BookingRepository bookingRepository,
            RoomRepository roomRepository,
            AccountRepository accountRepository,
            CustomerRepository customerRepository,
            RoleRepository roleRepository,
            CheckInRecordRepository checkInRecordRepository,
            BookingServiceItemRepository bookingServiceItemRepository,
            ServiceUsageRepository serviceUsageRepository,
            RoomAmenitiesUsageRepository roomAmenitiesUsageRepository,
            AppliedPenaltyRepository appliedPenaltyRepository,
            InvoiceRepository invoiceRepository,
            PaymentRepository paymentRepository,
            FacilityServiceRepository facilityServiceRepository,
            InventoryServiceRepository inventoryServiceRepository,
            RoomMiniBarItemRepository roomMiniBarItemRepository,
            RulesPenaltyRepository rulesPenaltyRepository,
            EmployeeRepository employeeRepository,
            PasswordEncoder passwordEncoder,
            PricePolicyRepository pricePolicyRepository,
            RoomPriceConfigRepository roomPriceConfigRepository,
            SePayPaymentService sePayPaymentService,
            HousekeepingTaskRepository housekeepingTaskRepository,
            BookingCodeGenerator bookingCodeGenerator,
            StayAccessService stayAccessService,
            ApplicationEventPublisher eventPublisher
    ) {
        this(
                bookingDetailRepository, bookingGuestRepository, bookingRepository, roomRepository,
                accountRepository, customerRepository, roleRepository, checkInRecordRepository,
                bookingServiceItemRepository, serviceUsageRepository, roomAmenitiesUsageRepository,
                appliedPenaltyRepository, invoiceRepository, paymentRepository,
                facilityServiceRepository, inventoryServiceRepository, roomMiniBarItemRepository,
                rulesPenaltyRepository, employeeRepository, passwordEncoder, pricePolicyRepository,
                roomPriceConfigRepository, sePayPaymentService, housekeepingTaskRepository,
                bookingCodeGenerator, stayAccessService, eventPublisher, null
        );
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
                .filter(detail -> ADMIN_SCHEDULE_BOOKING_STATUSES.contains(normalizeStatus(detail.getBooking().getStatus())))
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
    public List<AdminCheckInLogBookingResponse> getCheckInLogs(LocalDate fromDate, LocalDate toDate) {
        LocalDate startDate = fromDate != null ? fromDate : LocalDate.now().minusDays(30);
        LocalDate endDate = toDate != null ? toDate : LocalDate.now().plusDays(30);
        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("Ngày kết thúc phải sau ngày bắt đầu");
        }

        List<BookingDetail> details = bookingDetailRepository.findCheckInLogs(
                        startDate.atStartOfDay(),
                        endDate.plusDays(1).atStartOfDay()
                ).stream()
                .filter(detail -> CHECK_IN_LOG_BOOKING_STATUSES.contains(
                        normalizeStatus(detail.getBooking().getStatus())
                ))
                .toList();
        if (details.isEmpty()) {
            return List.of();
        }

        Map<Long, CheckInRecord> recordsByDetailId = checkInRecordRepository
                .findByBookingDetailIdsForAdmin(details.stream().map(BookingDetail::getId).toList())
                .stream()
                .collect(Collectors.toMap(record -> record.getBookingDetail().getId(), record -> record));
        Set<Long> inspectedRecordIds = recordsByDetailId.isEmpty()
                ? Set.of()
                : housekeepingTaskRepository.findByCheckInRecordIdIn(
                                recordsByDetailId.values().stream().map(CheckInRecord::getId).toList()
                        ).stream()
                        .filter(task -> "COMPLETED".equalsIgnoreCase(task.getInspectionStatus()))
                        .map(task -> task.getCheckInRecord().getId())
                        .collect(Collectors.toSet());

        Map<Long, List<BookingDetail>> detailsByBooking = details.stream()
                .collect(Collectors.groupingBy(
                        detail -> detail.getBooking().getId(),
                        LinkedHashMap::new,
                        Collectors.toList()
                ));

        return detailsByBooking.values().stream()
                .map(group -> toCheckInLogBookingResponse(group, recordsByDetailId, inspectedRecordIds))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public AdminBookingDetailResponse getBookingDetail(Long bookingDetailId) {
        BookingDetail detail = bookingDetailRepository.findByIdForAdminDetail(bookingDetailId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn đặt phòng"));

        Booking booking = detail.getBooking();
        Customer customer = booking.getCustomer();
        Room room = detail.getRoom();
        RoomType roomType = detail.getRoomType() != null
                ? detail.getRoomType()
                : room != null ? room.getRoomType() : null;
        List<CheckInRecord> checkInRecords = checkInRecordRepository.findByBookingDetailIdForAdmin(detail.getId());
        List<AdminInvoiceServiceItemResponse> serviceItems = buildServiceItems(detail.getId());
        List<AdminInvoicePenaltyItemResponse> penaltyItems = appliedPenaltyRepository.findByBookingDetailIdForAdmin(detail.getId())
                .stream()
                .map(this::toPenaltyItemResponse)
                .toList();
        List<RoomIncidentResponse> incidents = roomIncidentRepository == null ? List.of()
                : roomIncidentRepository.findByBookingDetailIdWithDetails(detail.getId()).stream()
                .map(this::toIncidentResponse)
                .toList();
        Invoice invoice = invoiceRepository.findByBookingIdForAdmin(booking.getId()).orElse(null);
        List<AdminPaymentResponse> payments = invoice == null
                ? List.of()
                : paymentRepository.findByInvoiceIdOrderByPaymentTimeDescIdDesc(invoice.getId()).stream()
                        .filter(payment -> !"CHECKOUT".equalsIgnoreCase(payment.getPaymentPurpose())
                                || payment.getBookingDetail() != null
                                && detail.getId().equals(payment.getBookingDetail().getId()))
                        .map(this::toPaymentResponse)
                        .toList();
        BigDecimal paidAmount = calculateDetailPaidAmount(detail, invoice);
        AdminBookingInvoiceSummaryResponse detailInvoice = invoice == null
                ? null
                : toDetailInvoiceSummaryResponse(detail, invoice, serviceItems, penaltyItems, checkInRecords);

        return new AdminBookingDetailResponse(
                booking.getId(),
                booking.getBookingCode(),
                detail.getId(),
                booking.getBookingDate(),
                booking.getStatus(),
                detail.getStatus(),
                room != null ? room.getId() : null,
                room != null ? room.getRoomNumber() : null,
                roomType != null ? roomType.getName() : null,
                detail.getCheckInTarget(),
                detail.getCheckOutTarget(),
                detail.getNumberOfAdults(),
                detail.getNumberOfChildren(),
                detail.getPriceAtBooking(),
                safeAmount(detail.getAllocatedDiscount()),
                finalRoomAmount(detail),
                booking.getVoucherCode(),
                booking.getVoucherDiscountType(),
                booking.getVoucherDiscountValue(),
                safeAmount(booking.getRoomChargeBeforeDiscount()),
                safeAmount(booking.getRoomDiscountAmount()),
                booking.isCustomerConfirmed(),
                booking.getCustomerFeedback(),
                booking.getCustomerFeedbackAt(),
                detail.getRentType(),
                toCustomerResponse(customer),
                bookingGuestRepository.findByBookingDetailIds(List.of(detail.getId())).stream()
                        .map(this::toBookingGuestResponse)
                        .toList(),
                checkInRecords.stream().map(this::toCheckInResponse).toList(),
                checkInRecords.stream().anyMatch(this::isInspectionComplete),
                serviceItems,
                penaltyItems,
                incidents,
                detailInvoice,
                paidAmount,
                payments,
                facilityServiceRepository.findAll().stream().map(this::toFacilityServiceResponse).toList(),
                inventoryServiceRepository.findAll().stream().map(this::toInventoryServiceResponse).toList(),
                roomMiniBarItemRepository.findAll().stream().map(this::toMiniBarResponse).toList(),
                rulesPenaltyRepository.findAll().stream().map(this::toRulesPenaltyResponse).toList(),
                detail.getExtensionHours() != null ? detail.getExtensionHours() : 0,
                safeExtensionAmount(detail),
                booking.getCancellationReason(),
                booking.getCancelledAt(),
                booking.getRefundRate(),
                booking.getRefundAmount() != null ? booking.getRefundAmount() : BigDecimal.ZERO,
                booking.getRefundStatus(),
                booking.getRefundInfo(),
                booking.getRefundCompletedAt(),
                booking.getRefundHandledBy()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminDirectBookingRoomResponse> getDirectBookingRooms(LocalDateTime checkInTarget, LocalDateTime checkOutTarget) {
        validateBookingRange(checkInTarget, checkOutTarget);

        Map<Long, List<BookingDetail>> busySlotsByRoom = bookingDetailRepository
                .findOverlappingSchedule(checkInTarget, checkOutTarget)
                .stream()
                .filter(this::isActiveBookingDetail)
                .filter(this::hasAssignedRoom)
                .collect(Collectors.groupingBy(detail -> detail.getRoom().getId()));

        return roomRepository.findAll().stream()
                .sorted(Comparator.comparing(Room::getRoomNumber, Comparator.nullsLast(String::compareToIgnoreCase)))
                .map(room -> toDirectBookingRoomResponse(room, busySlotsByRoom.getOrDefault(room.getId(), List.of())))
                .sorted(Comparator.comparing(AdminDirectBookingRoomResponse::available).reversed()
                        .thenComparing(AdminDirectBookingRoomResponse::roomNumber, Comparator.nullsLast(String::compareToIgnoreCase)))
                .toList();
    }

    @Override
    @Transactional(isolation = Isolation.SERIALIZABLE)
    public AdminDirectBookingResponse createDirectBooking(AdminDirectBookingRequest request) {
        validateBookingRange(request.checkInTarget(), request.checkOutTarget());

        List<AdminDirectBookingRoomRequest> selectedRooms = requireSelectedRooms(request.rooms());
        Set<Long> selectedRoomIds = selectedRooms.stream()
                .map(AdminDirectBookingRoomRequest::roomId)
                .collect(Collectors.toCollection(HashSet::new));
        if (selectedRoomIds.size() != selectedRooms.size()) {
            throw new IllegalArgumentException("Danh sách phòng bị trùng");
        }

        Map<Long, Room> roomsById = roomRepository.findAllById(selectedRoomIds)
                .stream()
                .collect(Collectors.toMap(Room::getId, room -> room));
        if (roomsById.size() != selectedRoomIds.size()) {
            throw new IllegalArgumentException("Không tìm thấy một hoặc nhiều phòng đã chọn");
        }

        for (AdminDirectBookingRoomRequest selectedRoom : selectedRooms) {
            Room room = roomsById.get(selectedRoom.roomId());
            if (room.getRoomType() == null || room.getRoomType().getId() == null) {
                throw new IllegalArgumentException("Phòng " + room.getRoomNumber() + " chưa được gán loại phòng");
            }
            validateCapacity(room.getRoomType(), selectedRoom.numberOfAdults(), selectedRoom.numberOfChildren());
        }

        Set<Long> busyRoomIds = bookingDetailRepository.findOverlappingSchedule(request.checkInTarget(), request.checkOutTarget())
                .stream()
                .filter(this::isActiveBookingDetail)
                .filter(this::hasAssignedRoom)
                .map(detail -> detail.getRoom().getId())
                .filter(selectedRoomIds::contains)
                .collect(Collectors.toSet());
        if (!busyRoomIds.isEmpty()) {
            String busyRooms = busyRoomIds.stream()
                    .map(roomsById::get)
                    .map(Room::getRoomNumber)
                    .sorted()
                    .collect(Collectors.joining(", "));
            throw new IllegalArgumentException("Phòng đã có booking trong khung giờ này: " + busyRooms);
        }

        Customer customer = findOrCreateWalkInCustomer(request);
        DepositPolicy depositPolicy = selectedRooms.stream()
                .map(selectedRoom -> roomsById.get(selectedRoom.roomId()))
                .map(Room::getRoomType)
                .filter(roomType -> roomType != null && roomType.getDepositPolicy() != null)
                .map(RoomType::getDepositPolicy)
                .findFirst()
                .orElse(null);

        // Tải price policy để lấy rentType thực và tính giá
        com.homestayManagement.homestayManagement.entity.PricePolicy pricePolicy =
                pricePolicyRepository.findById(request.pricePolicyId())
                        .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy gói thuê"));
        String normalizedRentType = normalizeStatus(pricePolicy.getRentType());
        boolean hasDepositOrHourly = depositPolicy != null
                || "HOURLY".equals(normalizedRentType)
                || "BY_HOUR".equals(normalizedRentType);

        String rawMethod = request.paymentMethod();
        String paymentMethod = rawMethod != null && !rawMethod.isBlank() ? rawMethod.trim().toUpperCase() : "CASH";
        boolean isCash = "CASH".equals(paymentMethod);
        boolean isPayAtCheckIn = "PAY_AT_CHECKIN".equals(paymentMethod) || "LATER".equals(paymentMethod);
        boolean isSepay = "SEPAY".equals(paymentMethod) || "TRANSFER".equals(paymentMethod) || "QR".equals(paymentMethod);

        boolean requiresPayment = isSepay && hasDepositOrHourly;
        String initialStatus = requiresPayment ? "PENDING" : "CONFIRMED";

        LocalDateTime bookingDate = LocalDateTime.now();
        Booking booking = bookingRepository.save(Booking.builder()
                .bookingCode(bookingCodeGenerator.generate(bookingDate))
                .customer(customer)
                .depositPolicy(depositPolicy)
                .bookingDate(bookingDate)
                .status(initialStatus)
                .build());

        List<BookingDetail> createdDetails = new ArrayList<>();
        BookingDetail firstDetail = null;
        for (AdminDirectBookingRoomRequest selectedRoom : selectedRooms) {
            Room room = roomsById.get(selectedRoom.roomId());
            RoomType roomType = room.getRoomType();

            // Xác định WEEKDAY hay WEEKEND theo ngày check-in
            String dayType = isDayWeekend(request.checkInTarget()) ? "WEEKEND" : "WEEKDAY";

            // Tra giá từ room_price_configs
            BigDecimal price = roomType == null ? BigDecimal.ZERO :
                    roomPriceConfigRepository
                            .findByRoomTypeIdAndPricePolicyIdAndDayType(
                                    roomType.getId(), pricePolicy.getId(), dayType)
                            .map(com.homestayManagement.homestayManagement.entity.RoomPriceConfig::getPrice)
                            .orElse(BigDecimal.ZERO);
            BookingDetail detail = bookingDetailRepository.save(BookingDetail.builder()
                    .booking(booking)
                    .roomType(roomType)
                    .room(room)
                    .roomAssignmentStatus("ASSIGNED")
                    .assignedAt(LocalDateTime.now())
                    .checkInTarget(request.checkInTarget())
                    .checkOutTarget(request.checkOutTarget())
                    .numberOfAdults(selectedRoom.numberOfAdults())
                    .numberOfChildren(selectedRoom.numberOfChildren())
                    .priceAtBooking(price)
                    .rentType(pricePolicy.getRentType())
                    .status(initialStatus)
                    .build());
            createdDetails.add(detail);
            if (firstDetail == null) {
                firstDetail = detail;
            }
            saveDirectBookingGuests(booking, detail, selectedRoom.guests());
            saveDirectBookingServices(detail, selectedRoom.services());
        }

        if (isCash && hasDepositOrHourly) {
            Invoice invoice = invoiceRepository.findByBookingIdForAdmin(booking.getId())
                    .orElseGet(() -> {
                        BigDecimal roomCharge = createdDetails.stream()
                                .map(this::finalRoomAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);
                        List<Long> detailIds = createdDetails.stream().map(BookingDetail::getId).filter(Objects::nonNull).toList();
                        BigDecimal serviceCharge = detailIds.isEmpty() ? BigDecimal.ZERO :
                                bookingServiceItemRepository.findByBookingDetailIds(detailIds).stream()
                                        .map(item -> item.getPriceAtBooking().multiply(BigDecimal.valueOf(item.getQuantity())))
                                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                        return invoiceRepository.save(Invoice.builder()
                                .booking(booking)
                                .roomCharge(roomCharge)
                                .roomDiscountAmount(safeAmount(booking.getRoomDiscountAmount()))
                                .serviceCharge(serviceCharge)
                                .penaltyCharge(BigDecimal.ZERO)
                                .totalAmount(roomCharge.add(serviceCharge))
                                .createdAt(LocalDateTime.now())
                                .build());
                    });

            BigDecimal cashAmount = calculateDirectDepositAmount(booking, createdDetails, invoice.getTotalAmount());
            if (cashAmount.compareTo(BigDecimal.ZERO) > 0) {
                paymentRepository.save(Payment.builder()
                        .invoice(invoice)
                        .paymentMethod("CASH")
                        .paymentPurpose("BOOKING")
                        .amount(cashAmount)
                        .status("SUCCESS")
                        .paymentTime(LocalDateTime.now())
                        .transactionNo("CASH-" + booking.getId() + "-" + System.currentTimeMillis())
                        .build());
            }
        }

        AdminBookingDetailResponse bookingResponse = getBookingDetail(firstDetail.getId());
        SePayPaymentResponse payment = requiresPayment
                ? sePayPaymentService.createBookingPaymentForAdmin(booking.getId())
                : null;
        return new AdminDirectBookingResponse(bookingResponse, requiresPayment, payment);
    }

    @Override
    @Transactional
    public AdminBookingDetailResponse confirmDirectCashPayment(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn đặt phòng"));
        List<BookingDetail> details = bookingDetailRepository.findByBookingId(bookingId);
        if (details.isEmpty()) {
            throw new IllegalArgumentException("Booking không có chi tiết phòng");
        }
        booking.setStatus("CONFIRMED");
        bookingRepository.save(booking);
        for (BookingDetail detail : details) {
            if ("PENDING".equalsIgnoreCase(detail.getStatus())) {
                detail.setStatus("CONFIRMED");
            }
        }
        bookingDetailRepository.saveAll(details);

        Invoice invoice = invoiceRepository.findByBookingIdForAdmin(bookingId)
                .orElseGet(() -> {
                    BigDecimal roomCharge = details.stream()
                            .map(this::finalRoomAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    List<Long> detailIds = details.stream().map(BookingDetail::getId).toList();
                    BigDecimal serviceCharge = bookingServiceItemRepository.findByBookingDetailIds(detailIds).stream()
                            .map(item -> item.getPriceAtBooking().multiply(BigDecimal.valueOf(item.getQuantity())))
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    return invoiceRepository.save(Invoice.builder()
                            .booking(booking)
                            .roomCharge(roomCharge)
                            .roomDiscountAmount(safeAmount(booking.getRoomDiscountAmount()))
                            .serviceCharge(serviceCharge)
                            .penaltyCharge(BigDecimal.ZERO)
                            .totalAmount(roomCharge.add(serviceCharge))
                            .createdAt(LocalDateTime.now())
                            .build());
                });

        BigDecimal depositAmount = calculateDirectDepositAmount(booking, details, invoice.getTotalAmount());
        if (depositAmount.compareTo(BigDecimal.ZERO) > 0) {
            paymentRepository.findFirstByInvoiceIdAndPaymentMethodAndPaymentPurposeAndStatusOrderByIdDesc(
                    invoice.getId(), "SEPAY", "BOOKING", "PENDING"
            ).ifPresent(p -> {
                p.setStatus("CANCELLED");
                paymentRepository.save(p);
            });

            paymentRepository.save(Payment.builder()
                    .invoice(invoice)
                    .paymentMethod("CASH")
                    .paymentPurpose("BOOKING")
                    .amount(depositAmount)
                    .status("SUCCESS")
                    .paymentTime(LocalDateTime.now())
                    .transactionNo("CASH-" + booking.getId() + "-" + System.currentTimeMillis())
                    .build());
        }

        return getBookingDetail(details.get(0).getId());
    }

    private BigDecimal calculateDirectDepositAmount(Booking booking, List<BookingDetail> details, BigDecimal totalAmount) {
        boolean hourly = details.stream()
                .map(BookingDetail::getRentType)
                .map(this::normalizeStatus)
                .anyMatch(type -> "HOURLY".equals(type) || "BY_HOUR".equals(type));
        if (hourly) {
            return details.stream()
                    .map(this::finalRoomAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }
        DepositPolicy policy = booking.getDepositPolicy();
        if (policy == null || policy.getPolicyValue() == null) {
            return BigDecimal.ZERO;
        }
        if ("PERCENTAGE".equalsIgnoreCase(policy.getCalculationType())) {
            return totalAmount.multiply(policy.getPolicyValue())
                    .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
        }
        return policy.getPolicyValue();
    }

    @Override
    @Transactional
    public AdminBookingDetailResponse updateBookingCustomer(Long bookingDetailId, AdminUpdateBookingCustomerRequest request) {
        BookingDetail detail = bookingDetailRepository.findByIdForAdminDetail(bookingDetailId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn đặt phòng"));

        // Chỉ cho phép sửa khi chưa check-in
        boolean hasCheckIn = checkInRecordRepository.findByBookingDetailId(bookingDetailId).isPresent();
        if (hasCheckIn) {
            throw new IllegalArgumentException("Không thể chỉnh sửa thông tin khách sau khi đã check-in");
        }

        Customer customer = detail.getBooking().getCustomer();
        customer.setFullName(request.fullName().trim());
        customer.setPhone(request.phone().trim());
        customer.setAddress(request.address() != null && !request.address().isBlank() ? request.address().trim() : null);
        customer.setDateOfBirth(request.dateOfBirth());
        customerRepository.save(customer);

        return getBookingDetail(bookingDetailId);
    }

    @Override
    @Transactional
    public AdminBookingDetailResponse updateBookingDetail(Long bookingDetailId, AdminUpdateBookingDetailRequest request) {
        BookingDetail detail = bookingDetailRepository.findByIdForAdminDetail(bookingDetailId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn đặt phòng"));

        // Chỉ cho phép sửa khi chưa check-in
        boolean hasCheckIn = checkInRecordRepository.findByBookingDetailId(bookingDetailId).isPresent();
        if (hasCheckIn) {
            throw new IllegalArgumentException("Không thể chỉnh sửa thông tin đặt phòng sau khi đã check-in");
        }

        if (!request.checkOutTarget().isAfter(request.checkInTarget())) {
            throw new IllegalArgumentException("Giờ trả phòng phải sau giờ nhận phòng");
        }

        RoomType roomType = detail.getRoomType() != null
                ? detail.getRoomType()
                : detail.getRoom() != null ? detail.getRoom().getRoomType() : null;
        validateCapacity(roomType, request.numberOfAdults(), request.numberOfChildren());

        // Tính lại giá nếu có pricePolicyId mới, hoặc giữ nguyên nếu không truyền
        BigDecimal newPrice = detail.getPriceAtBooking();
        String newRentType = detail.getRentType();
        if (request.pricePolicyId() != null) {
            com.homestayManagement.homestayManagement.entity.PricePolicy policy =
                    pricePolicyRepository.findById(request.pricePolicyId())
                            .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy gói thuê"));
            String dayType = isDayWeekend(request.checkInTarget()) ? "WEEKEND" : "WEEKDAY";
            newPrice = roomType == null ? BigDecimal.ZERO :
                    roomPriceConfigRepository
                            .findByRoomTypeIdAndPricePolicyIdAndDayType(roomType.getId(), policy.getId(), dayType)
                            .map(com.homestayManagement.homestayManagement.entity.RoomPriceConfig::getPrice)
                            .orElse(BigDecimal.ZERO);
            newRentType = policy.getRentType();
        }

        detail.setCheckInTarget(request.checkInTarget());
        detail.setCheckOutTarget(request.checkOutTarget());
        detail.setNumberOfAdults(request.numberOfAdults());
        detail.setNumberOfChildren(request.numberOfChildren());
        detail.setPriceAtBooking(newPrice);
        detail.setRentType(newRentType);
        bookingDetailRepository.save(detail);

        return getBookingDetail(bookingDetailId);
    }

    @Override
    public AdminBookingDetailResponse checkIn(Long bookingDetailId) {
        throw new IllegalArgumentException(
                "Vui lòng hoàn tất check-in tại Nhật ký lưu trú để cấp quyền truy cập cho người đại diện phòng"
        );
    }

    @Override
    @Transactional
    public AdminBookingDetailResponse checkOut(Long bookingDetailId) {
        BookingDetail detail = bookingDetailRepository.findByIdForAdminDetail(bookingDetailId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn đặt phòng"));
        CheckInRecord record = checkInRecordRepository.findByBookingDetailId(bookingDetailId)
                .orElseThrow(() -> new IllegalArgumentException("Phòng này chưa check-in"));
        requireInspectionComplete(record);
        BigDecimal outstandingBalance = calculateDetailOutstandingBalance(detail);
        if (outstandingBalance.compareTo(BigDecimal.ZERO) > 0) {
            throw new IllegalArgumentException("Vui lòng thanh toán số tiền còn lại trước khi checkout");
        }
        boolean firstCheckout = record.getActualCheckOut() == null;
        if (firstCheckout) {
            record.setActualCheckOut(LocalDateTime.now());
            checkInRecordRepository.save(record);
        }
        detail.setStatus("COMPLETED");
        if (detail.getRoom() != null) {
            detail.getRoom().setStatus("AVAILABLE");
            roomRepository.save(detail.getRoom());
        }
        if (firstCheckout) {
            restoreInventoryServices(detail.getId());
        }
        stayAccessService.expireAccess(detail.getId());
        bookingDetailRepository.save(detail);
        updateBookingCompletionStatus(detail.getBooking());
        if (firstCheckout) {
            publishCheckoutInvoiceEmail(detail.getBooking());
        }
        return getBookingDetail(bookingDetailId);
    }

    @Override
    @Transactional
    public AdminCheckoutResponse prepareCheckOut(Long bookingDetailId) {
        BookingDetail detail = bookingDetailRepository.findByIdForAdminDetail(bookingDetailId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn đặt phòng"));
        CheckInRecord record = checkInRecordRepository.findByBookingDetailId(bookingDetailId)
                .orElseThrow(() -> new IllegalArgumentException("Phòng này chưa check-in"));
        if (record.getActualCheckOut() != null || "COMPLETED".equalsIgnoreCase(detail.getStatus())) {
            return new AdminCheckoutResponse(true, getBookingDetail(bookingDetailId), null);
        }

        requireInspectionComplete(record);
        generateInvoice(bookingDetailId);
        Invoice invoice = invoiceRepository.findByBookingIdForAdmin(detail.getBooking().getId())
                .orElseThrow(() -> new IllegalArgumentException("Không thể tạo hóa đơn checkout"));
        BigDecimal remainingBalance = calculateDetailOutstandingBalance(detail);

        if (remainingBalance.compareTo(BigDecimal.ZERO) == 0) {
            return new AdminCheckoutResponse(true, checkOut(bookingDetailId), null);
        }

        SePayPaymentResponse payment = sePayPaymentService.createCheckoutPayment(
                detail.getBooking().getId(),
                detail.getId(),
                remainingBalance
        );
        return new AdminCheckoutResponse(false, getBookingDetail(bookingDetailId), payment);
    }

    @Override
    @Transactional
    public AdminCheckoutResponse recordCheckoutPayment(Long bookingDetailId, AdminCheckoutPaymentRequest request) {
        String paymentMethod = normalizeCounterPaymentMethod(request.paymentMethod());
        BookingDetail detail = bookingDetailRepository.findByIdForAdminDetail(bookingDetailId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn đặt phòng"));
        CheckInRecord record = checkInRecordRepository.findByBookingDetailId(bookingDetailId)
                .orElseThrow(() -> new IllegalArgumentException("Phòng này chưa check-in"));
        if (record.getActualCheckOut() != null || "COMPLETED".equalsIgnoreCase(detail.getStatus())) {
            return new AdminCheckoutResponse(true, getBookingDetail(bookingDetailId), null);
        }

        requireInspectionComplete(record);
        generateInvoice(bookingDetailId);
        Invoice invoice = invoiceRepository.findByBookingIdForAdmin(detail.getBooking().getId())
                .orElseThrow(() -> new IllegalArgumentException("Không thể tạo hóa đơn checkout"));
        BigDecimal remainingBalance = calculateDetailOutstandingBalance(detail);
        if (remainingBalance.compareTo(BigDecimal.ZERO) == 0) {
            return new AdminCheckoutResponse(true, checkOut(bookingDetailId), null);
        }

        paymentRepository.save(Payment.builder()
                .invoice(invoice)
                .bookingDetail(detail)
                .paymentMethod(paymentMethod)
                .paymentPurpose("CHECKOUT")
                .amount(remainingBalance)
                .status("SUCCESS")
                .transactionNo(paymentMethod + "-" + bookingDetailId + "-" + System.currentTimeMillis())
                .paymentTime(LocalDateTime.now())
                .build());
        return new AdminCheckoutResponse(true, checkOut(bookingDetailId), null);
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
            if (service.getQuantityInStock() != null) {
                if (request.quantity() > service.getQuantityInStock()) {
                    throw new IllegalArgumentException("Số lượng dịch vụ thuê đồ vượt tồn kho");
                }
                service.setQuantityInStock(service.getQuantityInStock() - request.quantity());
                inventoryServiceRepository.save(service);
            }
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

    @Override
    @Transactional
    public AdminBookingDetailResponse removeService(Long bookingDetailId, Long serviceUsageId) {
        CheckInRecord record = requireOpenCheckInRecord(bookingDetailId);
        ServiceUsage usage = serviceUsageRepository.findById(serviceUsageId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy dịch vụ đã chọn"));
        requireSameCheckInRecord(record, usage.getCheckInRecord().getId());
        serviceUsageRepository.delete(usage);
        return getBookingDetail(bookingDetailId);
    }

    @Override
    @Transactional
    public AdminBookingDetailResponse removeMiniBar(Long bookingDetailId, Long miniBarUsageId) {
        CheckInRecord record = requireOpenCheckInRecord(bookingDetailId);
        RoomAmenitiesUsage usage = roomAmenitiesUsageRepository.findById(miniBarUsageId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy mini-bar đã chọn"));
        requireSameCheckInRecord(record, usage.getCheckInRecord().getId());
        roomAmenitiesUsageRepository.delete(usage);
        return getBookingDetail(bookingDetailId);
    }

    @Override
    @Transactional
    public AdminBookingDetailResponse removePenalty(Long bookingDetailId, Long penaltyId) {
        CheckInRecord record = requireOpenCheckInRecord(bookingDetailId);
        AppliedPenalty penalty = appliedPenaltyRepository.findById(penaltyId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy khoản phạt đã chọn"));
        requireSameCheckInRecord(record, penalty.getCheckRecord().getId());
        appliedPenaltyRepository.delete(penalty);
        return getBookingDetail(bookingDetailId);
    }

    @Override
    @Transactional
    public AdminBookingDetailResponse generateInvoice(Long bookingDetailId) {
        BookingDetail detail = bookingDetailRepository.findByIdForAdminDetail(bookingDetailId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn đặt phòng"));
        Booking booking = detail.getBooking();
        if ("CANCELLED".equalsIgnoreCase(booking.getStatus())) {
            throw new IllegalArgumentException("Không thể tạo hóa đơn cho đơn đã hủy");
        }
        if (checkInRecordRepository.findByBookingIdForInvoice(booking.getId()).isEmpty()) {
            throw new IllegalArgumentException("Vui lòng check-in trước khi tạo hóa đơn");
        }

        BigDecimal roomCharge = bookingDetailRepository.findByBookingId(booking.getId()).stream()
                .filter(item -> !"CANCELLED".equalsIgnoreCase(item.getStatus()))
                .map(this::finalRoomAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal serviceCharge = calculateServiceCharge(booking.getId());
        BigDecimal penaltyCharge = calculatePenaltyCharge(booking.getId());
        BigDecimal totalAmount = roomCharge.add(serviceCharge).add(penaltyCharge);

        Invoice invoice = invoiceRepository.findByBookingIdForAdmin(booking.getId())
                .orElseGet(() -> Invoice.builder().booking(booking).createdAt(LocalDateTime.now()).build());
        invoice.setEmployee(getCurrentEmployee());
        invoice.setRoomCharge(roomCharge);
        invoice.setRoomDiscountAmount(safeAmount(booking.getRoomDiscountAmount()));
        invoice.setServiceCharge(serviceCharge);
        invoice.setPenaltyCharge(penaltyCharge);
        invoice.setTotalAmount(totalAmount);
        if (invoice.getCreatedAt() == null) {
            invoice.setCreatedAt(LocalDateTime.now());
        }
        invoiceRepository.save(invoice);

        return getBookingDetail(bookingDetailId);
    }

    private void validateBookingRange(LocalDateTime checkInTarget, LocalDateTime checkOutTarget) {
        if (checkInTarget == null || checkOutTarget == null) {
            throw new IllegalArgumentException("Vui lòng chọn đủ giờ nhận phòng và trả phòng");
        }
        if (!checkOutTarget.isAfter(checkInTarget)) {
            throw new IllegalArgumentException("Giờ trả phòng phải sau giờ nhận phòng");
        }
    }

    private List<AdminDirectBookingRoomRequest> requireSelectedRooms(List<AdminDirectBookingRoomRequest> rooms) {
        if (rooms == null || rooms.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng chọn ít nhất một phòng");
        }
        return rooms;
    }

    private void validateCapacity(RoomType roomType, Integer adults, Integer children) {
        if (roomType == null) {
            return;
        }
        if (adults != null && roomType.getMaxAdults() != null && adults > roomType.getMaxAdults()) {
            throw new IllegalArgumentException("Số người lớn vượt quá sức chứa loại phòng");
        }
        if (children != null && roomType.getMaxChildren() != null && children > roomType.getMaxChildren()) {
            throw new IllegalArgumentException("Số trẻ em vượt quá sức chứa loại phòng");
        }
    }

    private Customer findOrCreateWalkInCustomer(AdminDirectBookingRequest request) {
        String email = normalizeEmail(request.email());
        return accountRepository.findByEmail(email)
                .map(account -> {
                    if (account.getRole() == null || !"ROLE_CUSTOMER".equals(account.getRole().getName())) {
                        throw new IllegalArgumentException("Email này đang thuộc tài khoản nhân viên, vui lòng dùng email khách hàng khác");
                    }
                    account.setActive(true);
                    Customer customer = customerRepository.findByAccountId(account.getId())
                            .orElseThrow(() -> new IllegalArgumentException("Tài khoản khách hàng chưa có hồ sơ khách"));
                    updateCustomer(customer, request);
                    accountRepository.save(account);
                    return customerRepository.save(customer);
                })
                .orElseGet(() -> {
                    Role customerRole = roleRepository.findByName("ROLE_CUSTOMER")
                            .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy role khách hàng"));
                    Account account = accountRepository.save(Account.builder()
                            .email(email)
                            .password(passwordEncoder.encode("123456"))
                            .role(customerRole)
                            .isActive(true)
                            .build());
                    Customer customer = Customer.builder()
                            .account(account)
                            .build();
                    updateCustomer(customer, request);
                    return customerRepository.save(customer);
                });
    }

    private void updateCustomer(Customer customer, AdminDirectBookingRequest request) {
        customer.setFullName(request.fullName().trim());
        customer.setPhone(request.phone().trim());
        customer.setAddress(request.address() != null && !request.address().isBlank() ? request.address().trim() : null);
        customer.setDateOfBirth(request.dateOfBirth());
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    private String normalizeRentType(String rentType) {
        return rentType == null ? "BY_NIGHT" : rentType.trim().toUpperCase();
    }

    private boolean isDayWeekend(LocalDateTime dateTime) {
        if (dateTime == null) return false;
        DayOfWeek dow = dateTime.getDayOfWeek();
        return dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY;
    }

    private boolean isActiveBookingDetail(BookingDetail detail) {
        return BookingInventoryPolicy.blocksInventory(detail);
    }

    private boolean hasAssignedRoom(BookingDetail detail) {
        return detail.getRoom() != null && detail.getRoom().getId() != null;
    }

    private void saveDirectBookingGuests(
            Booking booking,
            BookingDetail detail,
            List<AdminDirectBookingGuestRequest> guests
    ) {
        for (int index = 0; index < guests.size(); index++) {
            AdminDirectBookingGuestRequest guest = guests.get(index);
            bookingGuestRepository.save(BookingGuest.builder()
                    .booking(booking)
                    .bookingDetail(detail)
                    .fullName(guest.fullName().trim())
                    .identityDocumentType("CCCD")
                    .identityDocumentNumber(guest.identityDocumentNumber().trim())
                    .dateOfBirth(guest.dateOfBirth())
                    .phone(guest.phone().trim())
                    .email(normalizeEmail(guest.email()))
                    .address(guest.address() != null && !guest.address().isBlank() ? guest.address().trim() : null)
                    .primaryGuest(index == 0)
                    .build());
        }
    }

    private void saveDirectBookingServices(
            BookingDetail detail,
            List<AdminDirectBookingServiceRequest> services
    ) {
        if (services == null || services.isEmpty()) {
            return;
        }
        for (AdminDirectBookingServiceRequest request : services) {
            String type = normalizeStatus(request.type());
            int quantity = request.quantity();
            if ("FACILITY".equals(type)) {
                FacilityService service = facilityServiceRepository.findById(request.serviceId())
                        .filter(FacilityService::isActive)
                        .orElseThrow(() -> new IllegalArgumentException("Dịch vụ không hợp lệ hoặc đã ngừng hoạt động"));
                bookingServiceItemRepository.save(BookingServiceItem.builder()
                        .bookingDetail(detail)
                        .facilityService(service)
                        .quantity(quantity)
                        .priceAtBooking(service.getPrice())
                        .build());
            } else if ("INVENTORY".equals(type)) {
                InventoryService service = inventoryServiceRepository.findById(request.serviceId())
                        .orElseThrow(() -> new IllegalArgumentException("Dịch vụ thuê đồ không hợp lệ"));
                if (service.getQuantityInStock() != null && quantity > service.getQuantityInStock()) {
                    throw new IllegalArgumentException("Số lượng dịch vụ vượt tồn kho");
                }
                bookingServiceItemRepository.save(BookingServiceItem.builder()
                        .bookingDetail(detail)
                        .inventoryService(service)
                        .quantity(quantity)
                        .priceAtBooking(service.getPrice())
                        .build());
                if (service.getQuantityInStock() != null) {
                    service.setQuantityInStock(service.getQuantityInStock() - quantity);
                    inventoryServiceRepository.save(service);
                }
            } else {
                throw new IllegalArgumentException("Loại dịch vụ không hợp lệ");
            }
        }
    }

    private boolean isClosedStatus(String status) {
        return "CANCELLED".equalsIgnoreCase(status) || "COMPLETED".equalsIgnoreCase(status);
    }

    private String normalizeStatus(String status) {
        return status == null ? "" : status.toUpperCase();
    }

    private AdminDirectBookingRoomResponse toDirectBookingRoomResponse(Room room, List<BookingDetail> busySlots) {
        RoomType roomType = room.getRoomType();
        DepositPolicy policy = roomType != null ? roomType.getDepositPolicy() : null;
        return new AdminDirectBookingRoomResponse(
                room.getId(),
                room.getRoomNumber(),
                roomType != null ? roomType.getName() : null,
                roomType != null ? roomType.getId() : null,
                roomType != null ? roomType.getMaxAdults() : null,
                roomType != null ? roomType.getMaxChildren() : null,
                policy != null ? policy.getId() : null,
                policy != null ? policy.getPolicyName() : null,
                policy != null ? policy.getCalculationType() : null,
                policy != null ? policy.getPolicyValue() : null,
                busySlots.isEmpty(),
                busySlots.stream()
                        .sorted(Comparator.comparing(BookingDetail::getCheckInTarget))
                        .map(this::toDirectBookingBusySlotResponse)
                        .toList()
        );
    }

    private AdminDirectBookingBusySlotResponse toDirectBookingBusySlotResponse(BookingDetail detail) {
        Customer customer = detail.getBooking().getCustomer();
        return new AdminDirectBookingBusySlotResponse(
                detail.getBooking().getId(),
                detail.getBooking().getBookingCode(),
                detail.getId(),
                customer != null ? customer.getFullName() : null,
                customer != null ? customer.getPhone() : null,
                detail.getCheckInTarget(),
                detail.getCheckOutTarget(),
                detail.getStatus()
        );
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
        RoomType roomType = detail.getRoomType() != null
                ? detail.getRoomType()
                : room != null ? room.getRoomType() : null;

        return new AdminBookingScheduleItemResponse(
                booking.getId(),
                booking.getBookingCode(),
                detail.getId(),
                room != null ? room.getId() : null,
                room != null ? room.getRoomNumber() : null,
                roomType != null ? roomType.getName() : null,
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
                detail.getStatus(),
                detail.getExtensionHours() != null ? detail.getExtensionHours() : 0,
                safeExtensionAmount(detail)
        );
    }

    private AdminCheckInLogBookingResponse toCheckInLogBookingResponse(
            List<BookingDetail> details,
            Map<Long, CheckInRecord> recordsByDetailId,
            Set<Long> inspectedRecordIds
    ) {
        Booking booking = details.getFirst().getBooking();
        Customer customer = booking.getCustomer();
        List<AdminCheckInLogDetailResponse> detailResponses = details.stream()
                .sorted(Comparator.comparing(BookingDetail::getCheckInTarget))
                .map(detail -> toCheckInLogDetailResponse(
                        detail,
                        recordsByDetailId.get(detail.getId()),
                        inspectedRecordIds
                ))
                .toList();
        BigDecimal totalAmount = details.stream()
                .map(this::finalRoomAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        int checkedInDetails = (int) detailResponses.stream()
                .filter(detail -> detail.checkInRecord() != null)
                .count();
        int completedDetails = (int) detailResponses.stream()
                .filter(detail -> "COMPLETED".equalsIgnoreCase(detail.detailStatus()))
                .count();

        return new AdminCheckInLogBookingResponse(
                booking.getId(),
                booking.getBookingCode(),
                booking.getBookingDate(),
                booking.getStatus(),
                toCustomerResponse(customer),
                detailResponses.size(),
                checkedInDetails,
                completedDetails,
                totalAmount,
                detailResponses
        );
    }

    private AdminCheckInLogDetailResponse toCheckInLogDetailResponse(
            BookingDetail detail,
            CheckInRecord record,
            Set<Long> inspectedRecordIds
    ) {
        Room room = detail.getRoom();
        RoomType roomType = detail.getRoomType() != null
                ? detail.getRoomType()
                : room != null ? room.getRoomType() : null;
        return new AdminCheckInLogDetailResponse(
                detail.getId(),
                room != null ? room.getId() : null,
                room != null ? room.getRoomNumber() : null,
                roomType != null ? roomType.getName() : null,
                detail.getCheckInTarget(),
                detail.getCheckOutTarget(),
                detail.getNumberOfAdults(),
                detail.getNumberOfChildren(),
                detail.getPriceAtBooking(),
                detail.getRentType(),
                detail.getStatus(),
                record != null ? toCheckInResponse(record) : null,
                record != null && inspectedRecordIds.contains(record.getId()),
                detail.getExtensionHours() != null ? detail.getExtensionHours() : 0,
                safeExtensionAmount(detail)
        );
    }

    private AdminBookingCustomerResponse toCustomerResponse(Customer customer) {
        return new AdminBookingCustomerResponse(
                customer.getId(),
                customer.getFullName(),
                customer.getAccount() != null ? customer.getAccount().getEmail() : customer.getEmail(),
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

    private AdminCustomerHistoryGuestResponse toBookingGuestResponse(BookingGuest guest) {
        return new AdminCustomerHistoryGuestResponse(
                guest.getId(), guest.getFullName(), guest.getIdentityDocumentType(),
                guest.getIdentityDocumentNumber(), guest.getDateOfBirth(), guest.getGender(),
                guest.getNationality(), guest.getPhone(), guest.getEmail(), guest.getAddress(),
                guest.isPrimaryGuest()
        );
    }

    private List<AdminInvoiceServiceItemResponse> buildServiceItems(Long bookingDetailId) {
        List<AdminInvoiceServiceItemResponse> items = new ArrayList<>();
        bookingServiceItemRepository.findByBookingDetailIds(List.of(bookingDetailId)).stream()
                .map(this::toBookingServiceItemResponse)
                .forEach(items::add);
        serviceUsageRepository.findByBookingDetailIdForAdmin(bookingDetailId).stream()
                .map(this::toServiceItemResponse)
                .forEach(items::add);
        roomAmenitiesUsageRepository.findByBookingDetailIdForAdmin(bookingDetailId).stream()
                .map(this::toMiniBarItemResponse)
                .forEach(items::add);
        return items;
    }

    private AdminInvoiceServiceItemResponse toBookingServiceItemResponse(BookingServiceItem item) {
        String type = item.getFacilityService() != null ? "FACILITY" : "INVENTORY";
        String name = item.getFacilityService() != null
                ? item.getFacilityService().getName()
                : item.getInventoryService().getName();
        BigDecimal totalPrice = item.getPriceAtBooking().multiply(BigDecimal.valueOf(item.getQuantity()));
        return new AdminInvoiceServiceItemResponse(
                -Math.abs(item.getId()),
                type,
                name,
                item.getQuantity(),
                item.getPriceAtBooking(),
                totalPrice
        );
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

    private RoomIncidentResponse toIncidentResponse(RoomIncident i) {
        if (i == null) return null;
        Room r = i.getRoom();
        BookingDetail bd = i.getBookingDetail();
        Booking b = bd != null ? bd.getBooking() : null;
        Customer c = b != null ? b.getCustomer() : null;
        return new RoomIncidentResponse(
                i.getId(),
                r != null ? r.getId() : null,
                r != null ? r.getRoomNumber() : null,
                r != null && r.getRoomType() != null ? r.getRoomType().getName() : null,
                bd != null ? bd.getId() : null,
                b != null ? b.getBookingCode() : null,
                c != null ? c.getFullName() : null,
                c != null ? c.getPhone() : null,
                i.getHousekeepingTask() != null ? i.getHousekeepingTask().getId() : null,
                i.getReportedBy() != null ? i.getReportedBy().getId() : null,
                i.getReportedBy() != null ? i.getReportedBy().getFullName() : null,
                i.getHandledBy() != null ? i.getHandledBy().getId() : null,
                i.getHandledBy() != null ? i.getHandledBy().getFullName() : null,
                i.getItemName(),
                i.getQuantity(),
                i.getIncidentType(),
                i.getSeverity(),
                i.getDescription(),
                i.getEvidenceImageUrl(),
                i.getStatus(),
                i.getLiability(),
                i.getEstimatedCost(),
                i.getCompensationAmount(),
                i.getAdminNotes(),
                i.getReportedAt(),
                i.getResolvedAt()
        );
    }

    private AdminBookingInvoiceSummaryResponse toDetailInvoiceSummaryResponse(
            BookingDetail detail,
            Invoice invoice,
            List<AdminInvoiceServiceItemResponse> serviceItems,
            List<AdminInvoicePenaltyItemResponse> penaltyItems,
            List<CheckInRecord> checkInRecords
    ) {
        BigDecimal roomCharge = "CANCELLED".equalsIgnoreCase(detail.getStatus())
                ? BigDecimal.ZERO
                : finalRoomAmount(detail);
        BigDecimal serviceCharge = serviceItems.stream()
                .map(AdminInvoiceServiceItemResponse::totalPrice)
                .map(this::safeAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal timePenalty = checkInRecords.stream()
                .map(record -> safeAmount(record.getEarlyCheckInFee()).add(safeAmount(record.getLateCheckOutFee())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal rulePenalty = penaltyItems.stream()
                .map(AdminInvoicePenaltyItemResponse::amount)
                .map(this::safeAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal penaltyCharge = timePenalty.add(rulePenalty);
        return new AdminBookingInvoiceSummaryResponse(
                invoice.getId(),
                roomCharge,
                serviceCharge,
                penaltyCharge,
                roomCharge.add(serviceCharge).add(penaltyCharge),
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

    private CheckInRecord requireOpenCheckInRecord(Long bookingDetailId) {
        CheckInRecord record = requireCheckInRecord(bookingDetailId);
        if (record.getActualCheckOut() != null) {
            throw new IllegalArgumentException("Không thể xóa chi phí sau khi đã check-out");
        }
        return record;
    }

    private void requireSameCheckInRecord(CheckInRecord expectedRecord, Long actualRecordId) {
        if (!expectedRecord.getId().equals(actualRecordId)) {
            throw new IllegalArgumentException("Khoản chi phí không thuộc ca lưu trú này");
        }
    }

    private void restoreInventoryServices(Long bookingDetailId) {
        bookingServiceItemRepository.findByBookingDetailIds(List.of(bookingDetailId)).stream()
                .filter(item -> item.getInventoryService() != null)
                .forEach(item -> restoreInventoryStock(item.getInventoryService(), item.getQuantity()));
        serviceUsageRepository.findByBookingDetailIdForAdmin(bookingDetailId).stream()
                .filter(usage -> usage.getInventoryService() != null)
                .forEach(usage -> restoreInventoryStock(usage.getInventoryService(), usage.getQuantity()));
    }

    private void restoreInventoryStock(InventoryService service, Integer quantity) {
        if (service == null || service.getQuantityInStock() == null || quantity == null || quantity <= 0) {
            return;
        }
        service.setQuantityInStock(service.getQuantityInStock() + quantity);
        inventoryServiceRepository.save(service);
    }

    private boolean isInspectionComplete(CheckInRecord record) {
        return housekeepingTaskRepository.findByCheckInRecordId(record.getId())
                .map(task -> "COMPLETED".equalsIgnoreCase(task.getInspectionStatus()))
                .orElse(false);
    }

    private BigDecimal calculateServiceCharge(Long bookingId) {
        List<Long> detailIds = bookingDetailRepository.findByBookingId(bookingId).stream()
                .map(BookingDetail::getId)
                .toList();
        BigDecimal bookedServiceTotal = detailIds.isEmpty()
                ? BigDecimal.ZERO
                : bookingServiceItemRepository.findByBookingDetailIds(detailIds).stream()
                        .map(item -> item.getPriceAtBooking().multiply(BigDecimal.valueOf(item.getQuantity())))
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal serviceTotal = serviceUsageRepository.findByBookingIdForInvoice(bookingId).stream()
                .map(usage -> usage.getPriceAtUse().multiply(BigDecimal.valueOf(usage.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal miniBarTotal = roomAmenitiesUsageRepository.findByBookingIdForInvoice(bookingId).stream()
                .map(usage -> usage.getItem().getPrice().multiply(BigDecimal.valueOf(usage.getQuantityUsed())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return bookedServiceTotal.add(serviceTotal).add(miniBarTotal);
    }

    private BigDecimal calculatePenaltyCharge(Long bookingId) {
        BigDecimal timePenalty = checkInRecordRepository.findByBookingIdForInvoice(bookingId).stream()
                .map(record -> safeAmount(record.getEarlyCheckInFee()).add(safeAmount(record.getLateCheckOutFee())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal rulePenalty = appliedPenaltyRepository.findByBookingIdForInvoice(bookingId).stream()
                .map(AppliedPenalty::getActualFine)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return timePenalty.add(rulePenalty);
    }

    private BigDecimal calculateDetailOutstandingBalance(BookingDetail detail) {
        Invoice invoice = invoiceRepository.findByBookingIdForAdmin(detail.getBooking().getId()).orElse(null);
        return calculateDetailTotalCharge(detail)
                .subtract(calculateDetailPaidAmount(detail, invoice))
                .max(BigDecimal.ZERO);
    }

    private BigDecimal calculateDetailPaidAmount(BookingDetail detail, Invoice invoice) {
        if (invoice == null) {
            return BigDecimal.ZERO;
        }
        List<Payment> successfulPayments = paymentRepository
                .findByInvoiceIdOrderByPaymentTimeDescIdDesc(invoice.getId()).stream()
                .filter(payment -> "SUCCESS".equalsIgnoreCase(payment.getStatus()))
                .toList();
        BigDecimal bookingPaid = successfulPayments.stream()
                .filter(payment -> !"CHECKOUT".equalsIgnoreCase(payment.getPaymentPurpose()))
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal checkoutPaid = successfulPayments.stream()
                .filter(payment -> "CHECKOUT".equalsIgnoreCase(payment.getPaymentPurpose()))
                .filter(payment -> payment.getBookingDetail() != null
                        && detail.getId().equals(payment.getBookingDetail().getId()))
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<BookingDetail> bookingDetails = bookingDetailRepository.findByBookingId(detail.getBooking().getId()).stream()
                .filter(item -> !"CANCELLED".equalsIgnoreCase(item.getStatus()))
                .toList();
        BigDecimal bookingBaseTotal = bookingDetails.stream()
                .map(this::calculateDetailBookingBaseCharge)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal detailBase = calculateDetailBookingBaseCharge(detail);
        BigDecimal allocatedBookingPaid = bookingBaseTotal.compareTo(BigDecimal.ZERO) == 0
                ? BigDecimal.ZERO
                : bookingPaid.multiply(detailBase)
                        .divide(bookingBaseTotal, 2, RoundingMode.HALF_UP)
                        .min(detailBase);
        return allocatedBookingPaid.add(checkoutPaid);
    }

    private BigDecimal calculateDetailBookingBaseCharge(BookingDetail detail) {
        BigDecimal bookedServices = bookingServiceItemRepository.findByBookingDetailIds(List.of(detail.getId())).stream()
                .map(item -> safeAmount(item.getPriceAtBooking())
                        .multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return finalRoomAmount(detail).add(bookedServices);
    }

    private String normalizeCounterPaymentMethod(String paymentMethod) {
        if (paymentMethod == null) {
            throw new IllegalArgumentException("Vui lòng chọn phương thức thanh toán");
        }
        String normalized = paymentMethod.trim().toUpperCase();
        if (!Set.of("CASH", "CARD").contains(normalized)) {
            throw new IllegalArgumentException("Phương thức thanh toán tại quầy không hợp lệ");
        }
        return normalized;
    }

    private BigDecimal calculateDetailTotalCharge(BookingDetail detail) {
        BigDecimal serviceCharge = buildServiceItems(detail.getId()).stream()
                .map(AdminInvoiceServiceItemResponse::totalPrice)
                .map(this::safeAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal timePenalty = checkInRecordRepository.findByBookingDetailIdForAdmin(detail.getId()).stream()
                .map(record -> safeAmount(record.getEarlyCheckInFee()).add(safeAmount(record.getLateCheckOutFee())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal rulePenalty = appliedPenaltyRepository.findByBookingDetailIdForAdmin(detail.getId()).stream()
                .map(AppliedPenalty::getActualFine)
                .map(this::safeAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return finalRoomAmount(detail).add(serviceCharge).add(timePenalty).add(rulePenalty);
    }

    private BigDecimal calculateTotalCharge(Long bookingId) {
        BigDecimal roomCharge = bookingDetailRepository.findByBookingId(bookingId).stream()
                .filter(item -> !"CANCELLED".equalsIgnoreCase(item.getStatus()))
                .map(this::finalRoomAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return roomCharge.add(calculateServiceCharge(bookingId)).add(calculatePenaltyCharge(bookingId));
    }

    private BigDecimal safeAmount(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private BigDecimal finalRoomAmount(BookingDetail detail) {
        BigDecimal finalAmount = safeAmount(detail.getPriceAtBooking()).subtract(safeAmount(detail.getAllocatedDiscount()));
        return finalAmount.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : finalAmount;
    }

    private void requireInspectionComplete(CheckInRecord record) {
        if (housekeepingTaskRepository == null) {
            throw new IllegalArgumentException("Chức năng housekeeping chưa sẵn sàng");
        }
        var task = housekeepingTaskRepository.findByCheckInRecordId(record.getId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Vui lòng gửi yêu cầu housekeeping kiểm tra phòng trước khi checkout"
                ));
        if (!"COMPLETED".equalsIgnoreCase(task.getInspectionStatus())) {
            throw new IllegalArgumentException("Housekeeping chưa gửi kết quả kiểm tra chi phí");
        }
    }

    private void updateBookingCompletionStatus(Booking booking) {
        boolean allClosed = bookingDetailRepository.findByBookingId(booking.getId()).stream()
                .allMatch(item -> Set.of("COMPLETED", "CANCELLED").contains(normalizeStatus(item.getStatus())));
        booking.setStatus(allClosed ? "COMPLETED" : "CHECKED_IN");
        bookingRepository.save(booking);
    }

    private void publishCheckoutInvoiceEmail(Booking booking) {
        if (eventPublisher == null || booking == null || booking.getId() == null) {
            return;
        }
        invoiceRepository.findByBookingIdForAdmin(booking.getId())
                .map(Invoice::getId)
                .ifPresent(invoiceId -> eventPublisher.publishEvent(new CheckoutInvoiceEmailEvent(invoiceId)));
    }

    private Employee getCurrentEmployee() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new IllegalArgumentException("Không xác định được nhân viên đang đăng nhập");
        }
        return employeeRepository.findByAccountEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("Tài khoản hiện tại chưa có hồ sơ nhân viên"));
    }

    private FacilityServiceResponse toFacilityServiceResponse(FacilityService service) {
        return new FacilityServiceResponse(
                service.getId(),
                service.getName(),
                service.getPrice(),
                service.isActive(),
                service.getImageUrl()
        );
    }

    private InventoryServiceResponse toInventoryServiceResponse(InventoryService service) {
        return new InventoryServiceResponse(
                service.getId(),
                service.getName(),
                service.getPrice(),
                service.getQuantityInStock(),
                service.getImageUrl()
        );
    }

    private RoomMiniBarItemResponse toMiniBarResponse(RoomMiniBarItem item) {
        return new RoomMiniBarItemResponse(
                item.getId(),
                item.getName(),
                item.getPrice(),
                item.getQuantityInStock(),
                item.getImageUrl()
        );
    }

    private RulesPenaltyResponse toRulesPenaltyResponse(RulesPenalty penalty) {
        return new RulesPenaltyResponse(penalty.getId(), penalty.getTitle(), penalty.getPenaltyAmount());
    }

    private BigDecimal calculateHourlyRate(RoomType roomType, BookingDetail detail) {
        if (roomType == null) {
            return BigDecimal.valueOf(80_000);
        }
        List<RoomPriceConfig> configs = roomPriceConfigRepository.findByRoomTypeIdWithPolicy(roomType.getId());
        for (RoomPriceConfig cfg : configs) {
            if (cfg.getPricePolicy() != null && isHourlyPolicy(cfg.getPricePolicy()) && cfg.getPrice() != null && cfg.getPrice().compareTo(BigDecimal.ZERO) > 0) {
                int limitHours = cfg.getPricePolicy().getLimitHours() != null && cfg.getPricePolicy().getLimitHours() > 0 ? cfg.getPricePolicy().getLimitHours() : 1;
                return cfg.getPrice().divide(BigDecimal.valueOf(limitHours), 0, RoundingMode.HALF_UP);
            }
        }
        if (detail != null && detail.getPriceAtBooking() != null && detail.getPriceAtBooking().compareTo(BigDecimal.ZERO) > 0) {
            return detail.getPriceAtBooking().divide(BigDecimal.valueOf(20), 0, RoundingMode.HALF_UP).max(BigDecimal.valueOf(50_000));
        }
        for (RoomPriceConfig cfg : configs) {
            if (cfg.getPrice() != null && cfg.getPrice().compareTo(BigDecimal.ZERO) > 0) {
                return cfg.getPrice().divide(BigDecimal.valueOf(20), 0, RoundingMode.HALF_UP).max(BigDecimal.valueOf(50_000));
            }
        }
        return BigDecimal.valueOf(80_000);
    }

    private boolean isHourlyPolicy(PricePolicy policy) {
        if (policy == null || policy.getRentType() == null) return false;
        String type = policy.getRentType().trim().toUpperCase();
        return "HOURLY".equals(type) || "BY_HOUR".equals(type);
    }

    private BigDecimal safeExtensionAmount(BookingDetail detail) {
        if (detail == null) return BigDecimal.ZERO;
        if (detail.getExtensionAmount() != null && detail.getExtensionAmount().compareTo(BigDecimal.ZERO) > 0) {
            return detail.getExtensionAmount();
        }
        if (detail.getExtensionHours() != null && detail.getExtensionHours() > 0) {
            BigDecimal hourlyRate = calculateHourlyRate(detail.getRoomType(), detail);
            return hourlyRate.multiply(BigDecimal.valueOf(detail.getExtensionHours()));
        }
        return BigDecimal.ZERO;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminBookingCancellationResponse> getCancellations() {
        return bookingRepository.findCancellationsOrderByCancelledAtDesc().stream()
                .map(this::toCancellationResponse)
                .toList();
    }

    private AdminBookingCancellationResponse toCancellationResponse(Booking booking) {
        Customer customer = booking.getCustomer();
        Account account = customer != null ? customer.getAccount() : null;
        List<BookingDetail> details = bookingDetailRepository.findByBookingId(booking.getId());

        LocalDateTime earliestCheckIn = details.stream()
                .map(BookingDetail::getCheckInTarget)
                .filter(java.util.Objects::nonNull)
                .min(LocalDateTime::compareTo)
                .orElse(booking.getBookingDate());

        BigDecimal roomCharge = details.stream()
                .map(this::finalRoomAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal serviceCharge = calculateServiceCharge(booking.getId());
        BigDecimal totalAmount = roomCharge.add(serviceCharge);

        Optional<com.homestayManagement.homestayManagement.entity.Invoice> invoiceOpt = invoiceRepository.findByBookingId(booking.getId());
        BigDecimal paidAmount = invoiceOpt.map(invoice -> paymentRepository.findByInvoiceIdOrderByPaymentTimeDescIdDesc(invoice.getId()).stream()
                .filter(p -> "SUCCESS".equalsIgnoreCase(p.getStatus()))
                .map(com.homestayManagement.homestayManagement.entity.Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)).orElse(BigDecimal.ZERO);

        String zaloPhone = customer != null ? customer.getPhone() : null;

        return new AdminBookingCancellationResponse(
                booking.getId(),
                booking.getBookingCode(),
                customer != null ? customer.getId() : null,
                customer != null ? customer.getFullName() : null,
                customer != null ? customer.getPhone() : null,
                account != null ? account.getEmail() : null,
                zaloPhone,
                booking.getBookingDate(),
                earliestCheckIn,
                booking.getCancelledAt(),
                booking.getCancellationReason(),
                totalAmount,
                paidAmount,
                booking.getRefundRate(),
                booking.getRefundAmount() != null ? booking.getRefundAmount() : BigDecimal.ZERO,
                booking.getRefundStatus(),
                booking.getRefundInfo(),
                booking.getRefundCompletedAt(),
                booking.getRefundHandledBy()
        );
    }

    @Override
    @Transactional
    public AdminBookingDetailResponse confirmRefund(Long bookingId, String employeeEmail) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn đặt phòng"));
        if (!"CANCELLED".equalsIgnoreCase(booking.getStatus())) {
            throw new IllegalArgumentException("Đơn đặt phòng chưa bị hủy");
        }
        booking.setRefundStatus("REFUNDED");
        booking.setRefundCompletedAt(LocalDateTime.now());
        booking.setRefundHandledBy(employeeEmail);
        bookingRepository.save(booking);

        List<BookingDetail> details = bookingDetailRepository.findByBookingId(booking.getId());
        if (details.isEmpty()) {
            throw new IllegalArgumentException("Đơn đặt phòng không có thông tin chi tiết");
        }
        return getBookingDetail(details.get(0).getId());
    }
}
