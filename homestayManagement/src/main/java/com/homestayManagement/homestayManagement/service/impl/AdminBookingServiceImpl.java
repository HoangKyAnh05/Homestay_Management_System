package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.request.AdminUpdateBookingCustomerRequest;
import com.homestayManagement.homestayManagement.dto.request.AdminUpdateBookingDetailRequest;
import com.homestayManagement.homestayManagement.dto.request.AdminDirectBookingRequest;
import com.homestayManagement.homestayManagement.dto.request.AdminDirectBookingGuestRequest;
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
import com.homestayManagement.homestayManagement.dto.response.FacilityServiceResponse;
import com.homestayManagement.homestayManagement.dto.response.InventoryServiceResponse;
import com.homestayManagement.homestayManagement.dto.request.AdminDirectBookingRoomRequest;
import com.homestayManagement.homestayManagement.dto.response.AdminInvoicePenaltyItemResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminInvoiceServiceItemResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminPaymentResponse;
import com.homestayManagement.homestayManagement.dto.response.RoomMiniBarItemResponse;
import com.homestayManagement.homestayManagement.dto.response.RulesPenaltyResponse;
import com.homestayManagement.homestayManagement.dto.response.SePayPaymentResponse;
import com.homestayManagement.homestayManagement.entity.Account;
import com.homestayManagement.homestayManagement.entity.AppliedPenalty;
import com.homestayManagement.homestayManagement.entity.Booking;
import com.homestayManagement.homestayManagement.entity.BookingDetail;
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
import com.homestayManagement.homestayManagement.repository.CheckInRecordRepository;
import com.homestayManagement.homestayManagement.repository.CustomerRepository;
import com.homestayManagement.homestayManagement.repository.EmployeeRepository;
import com.homestayManagement.homestayManagement.repository.FacilityServiceRepository;
import com.homestayManagement.homestayManagement.repository.InvoiceRepository;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
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

    public AdminBookingServiceImpl(
            BookingDetailRepository bookingDetailRepository,
            BookingGuestRepository bookingGuestRepository,
            BookingRepository bookingRepository,
            RoomRepository roomRepository,
            AccountRepository accountRepository,
            CustomerRepository customerRepository,
            RoleRepository roleRepository,
            CheckInRecordRepository checkInRecordRepository,
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
            SePayPaymentService sePayPaymentService
    ) {
        this.bookingDetailRepository = bookingDetailRepository;
        this.bookingGuestRepository = bookingGuestRepository;
        this.bookingRepository = bookingRepository;
        this.roomRepository = roomRepository;
        this.accountRepository = accountRepository;
        this.customerRepository = customerRepository;
        this.roleRepository = roleRepository;
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
        this.employeeRepository = employeeRepository;
        this.passwordEncoder = passwordEncoder;
        this.pricePolicyRepository = pricePolicyRepository;
        this.roomPriceConfigRepository = roomPriceConfigRepository;
        this.sePayPaymentService = sePayPaymentService;
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

        Map<Long, List<BookingDetail>> detailsByBooking = details.stream()
                .collect(Collectors.groupingBy(
                        detail -> detail.getBooking().getId(),
                        LinkedHashMap::new,
                        Collectors.toList()
                ));

        return detailsByBooking.values().stream()
                .map(group -> toCheckInLogBookingResponse(group, recordsByDetailId))
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
        Invoice invoice = invoiceRepository.findByBookingIdForAdmin(booking.getId()).orElse(null);
        List<AdminPaymentResponse> payments = invoice == null
                ? List.of()
                : paymentRepository.findByInvoiceIdOrderByPaymentTimeDescIdDesc(invoice.getId()).stream()
                        .map(this::toPaymentResponse)
                        .toList();
        BigDecimal paidAmount = payments.stream()
                .filter(payment -> "SUCCESS".equalsIgnoreCase(payment.status()))
                .map(AdminPaymentResponse::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new AdminBookingDetailResponse(
                booking.getId(),
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
                detail.getRentType(),
                toCustomerResponse(customer),
                bookingGuestRepository.findByBookingDetailIds(List.of(detail.getId())).stream()
                        .map(this::toBookingGuestResponse)
                        .toList(),
                checkInRecords.stream().map(this::toCheckInResponse).toList(),
                serviceItems,
                penaltyItems,
                invoice != null ? toInvoiceSummaryResponse(invoice) : null,
                paidAmount,
                payments,
                facilityServiceRepository.findAll().stream().map(this::toFacilityServiceResponse).toList(),
                inventoryServiceRepository.findAll().stream().map(this::toInventoryServiceResponse).toList(),
                roomMiniBarItemRepository.findAll().stream().map(this::toMiniBarResponse).toList(),
                rulesPenaltyRepository.findAll().stream().map(this::toRulesPenaltyResponse).toList()
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
    @Transactional
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
        boolean requiresPayment = depositPolicy != null
                || "HOURLY".equals(normalizedRentType)
                || "BY_HOUR".equals(normalizedRentType);
        String initialStatus = requiresPayment ? "PENDING" : "CONFIRMED";

        Booking booking = bookingRepository.save(Booking.builder()
                .customer(customer)
                .depositPolicy(depositPolicy)
                .bookingDate(LocalDateTime.now())
                .status(initialStatus)
                .build());

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
            if (firstDetail == null) {
                firstDetail = detail;
            }
            saveDirectBookingGuests(booking, detail, selectedRoom.guests());
        }

        AdminBookingDetailResponse bookingResponse = getBookingDetail(firstDetail.getId());
        SePayPaymentResponse payment = requiresPayment
                ? sePayPaymentService.createBookingPaymentForAdmin(booking.getId())
                : null;
        return new AdminDirectBookingResponse(bookingResponse, requiresPayment, payment);
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
                        .receptionist(getCurrentEmployee())
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
        BigDecimal outstandingExtraCharge = calculateOutstandingExtraCharge(detail.getBooking().getId());
        if (outstandingExtraCharge.compareTo(BigDecimal.ZERO) > 0) {
            throw new IllegalArgumentException("Vui lòng thanh toán chi phí phát sinh trước khi checkout");
        }
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
    public AdminCheckoutResponse prepareCheckOut(Long bookingDetailId) {
        BookingDetail detail = bookingDetailRepository.findByIdForAdminDetail(bookingDetailId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn đặt phòng"));
        CheckInRecord record = checkInRecordRepository.findByBookingDetailId(bookingDetailId)
                .orElseThrow(() -> new IllegalArgumentException("Phòng này chưa check-in"));
        if (record.getActualCheckOut() != null || "COMPLETED".equalsIgnoreCase(detail.getStatus())) {
            return new AdminCheckoutResponse(true, getBookingDetail(bookingDetailId), null);
        }

        generateInvoice(bookingDetailId);
        Invoice invoice = invoiceRepository.findByBookingIdForAdmin(detail.getBooking().getId())
                .orElseThrow(() -> new IllegalArgumentException("Không thể tạo hóa đơn checkout"));
        BigDecimal remainingExtraCharge = calculateOutstandingExtraCharge(detail.getBooking().getId());

        if (remainingExtraCharge.compareTo(BigDecimal.ZERO) == 0) {
            return new AdminCheckoutResponse(true, checkOut(bookingDetailId), null);
        }

        SePayPaymentResponse payment = sePayPaymentService.createCheckoutPayment(
                detail.getBooking().getId(),
                remainingExtraCharge
        );
        return new AdminCheckoutResponse(false, getBookingDetail(bookingDetailId), payment);
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
                .map(BookingDetail::getPriceAtBooking)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal serviceCharge = calculateServiceCharge(booking.getId());
        BigDecimal penaltyCharge = calculatePenaltyCharge(booking.getId());
        BigDecimal totalAmount = roomCharge.add(serviceCharge).add(penaltyCharge);

        Invoice invoice = invoiceRepository.findByBookingIdForAdmin(booking.getId())
                .orElseGet(() -> Invoice.builder().booking(booking).createdAt(LocalDateTime.now()).build());
        invoice.setEmployee(getCurrentEmployee());
        invoice.setRoomCharge(roomCharge);
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
        if (detail == null || detail.getBooking() == null) {
            return false;
        }
        String detailStatus = detail.getStatus();
        String bookingStatus = detail.getBooking().getStatus();
        return !isClosedStatus(detailStatus) && !isClosedStatus(bookingStatus);
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
                detail.getStatus()
        );
    }

    private AdminCheckInLogBookingResponse toCheckInLogBookingResponse(
            List<BookingDetail> details,
            Map<Long, CheckInRecord> recordsByDetailId
    ) {
        Booking booking = details.getFirst().getBooking();
        Customer customer = booking.getCustomer();
        List<AdminCheckInLogDetailResponse> detailResponses = details.stream()
                .sorted(Comparator.comparing(BookingDetail::getCheckInTarget))
                .map(detail -> toCheckInLogDetailResponse(detail, recordsByDetailId.get(detail.getId())))
                .toList();
        BigDecimal totalAmount = details.stream()
                .map(BookingDetail::getPriceAtBooking)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        int checkedInDetails = (int) detailResponses.stream()
                .filter(detail -> detail.checkInRecord() != null)
                .count();
        int completedDetails = (int) detailResponses.stream()
                .filter(detail -> "COMPLETED".equalsIgnoreCase(detail.detailStatus()))
                .count();

        return new AdminCheckInLogBookingResponse(
                booking.getId(),
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

    private AdminCheckInLogDetailResponse toCheckInLogDetailResponse(BookingDetail detail, CheckInRecord record) {
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
                record != null ? toCheckInResponse(record) : null
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

    private BigDecimal calculateServiceCharge(Long bookingId) {
        BigDecimal serviceTotal = serviceUsageRepository.findByBookingIdForInvoice(bookingId).stream()
                .map(usage -> usage.getPriceAtUse().multiply(BigDecimal.valueOf(usage.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal miniBarTotal = roomAmenitiesUsageRepository.findByBookingIdForInvoice(bookingId).stream()
                .map(usage -> usage.getItem().getPrice().multiply(BigDecimal.valueOf(usage.getQuantityUsed())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return serviceTotal.add(miniBarTotal);
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

    private BigDecimal calculateOutstandingExtraCharge(Long bookingId) {
        BigDecimal extraCharge = calculateServiceCharge(bookingId).add(calculatePenaltyCharge(bookingId));
        Invoice invoice = invoiceRepository.findByBookingIdForAdmin(bookingId).orElse(null);
        if (invoice == null) {
            return extraCharge;
        }
        BigDecimal paidCheckoutAmount = paymentRepository.findByInvoiceIdOrderByPaymentTimeDescIdDesc(invoice.getId()).stream()
                .filter(payment -> "CHECKOUT".equalsIgnoreCase(payment.getPaymentPurpose()))
                .filter(payment -> "SUCCESS".equalsIgnoreCase(payment.getStatus()))
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return extraCharge.subtract(paidCheckoutAmount).max(BigDecimal.ZERO);
    }

    private BigDecimal safeAmount(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
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
