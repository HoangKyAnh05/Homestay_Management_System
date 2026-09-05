package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.request.PublicBookingCancelRequest;
import com.homestayManagement.homestayManagement.dto.request.PublicBookingExtendRequest;
import com.homestayManagement.homestayManagement.dto.request.PublicBookingExtensionCheckRequest;
import com.homestayManagement.homestayManagement.dto.request.PublicBookingFeedbackRequest;
import com.homestayManagement.homestayManagement.dto.request.PublicBookingRoomRequest;
import com.homestayManagement.homestayManagement.dto.request.PublicBookingServiceRequest;
import com.homestayManagement.homestayManagement.dto.request.PublicCreateBookingRequest;
import com.homestayManagement.homestayManagement.dto.response.*;
import com.homestayManagement.homestayManagement.entity.*;
import com.homestayManagement.homestayManagement.repository.*;
import com.homestayManagement.homestayManagement.service.PublicBookingService;
import com.homestayManagement.homestayManagement.service.event.PublicBookingConfirmationEmailEvent;
import com.homestayManagement.homestayManagement.service.support.BookingCodeGenerator;
import com.homestayManagement.homestayManagement.service.support.BookingInventoryPolicy;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class PublicBookingServiceImpl implements PublicBookingService {

    private final AccountRepository accountRepository;
    private final CustomerRepository customerRepository;
    private final RoomRepository roomRepository;
    private final RoomTypeRepository roomTypeRepository;
    private final BookingRepository bookingRepository;
    private final BookingDetailRepository bookingDetailRepository;
    private final BookingGuestRepository bookingGuestRepository;
    private final BookingServiceItemRepository bookingServiceItemRepository;
    private final ServiceUsageRepository serviceUsageRepository;
    private final PricePolicyRepository pricePolicyRepository;
    private final RoomPriceConfigRepository roomPriceConfigRepository;
    private final FacilityServiceRepository facilityServiceRepository;
    private final InventoryServiceRepository inventoryServiceRepository;
    private final VoucherRepository voucherRepository;
    private final BookingCodeGenerator bookingCodeGenerator;
    private final ApplicationEventPublisher eventPublisher;
    private final com.homestayManagement.homestayManagement.repository.RoomIncidentRepository roomIncidentRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;

    public PublicBookingServiceImpl(
            AccountRepository accountRepository,
            CustomerRepository customerRepository,
            RoomRepository roomRepository,
            RoomTypeRepository roomTypeRepository,
            BookingRepository bookingRepository,
            BookingDetailRepository bookingDetailRepository,
            BookingGuestRepository bookingGuestRepository,
            BookingServiceItemRepository bookingServiceItemRepository,
            ServiceUsageRepository serviceUsageRepository,
            PricePolicyRepository pricePolicyRepository,
            RoomPriceConfigRepository roomPriceConfigRepository,
            FacilityServiceRepository facilityServiceRepository,
            InventoryServiceRepository inventoryServiceRepository,
            VoucherRepository voucherRepository,
            BookingCodeGenerator bookingCodeGenerator,
            ApplicationEventPublisher eventPublisher,
            com.homestayManagement.homestayManagement.repository.RoomIncidentRepository roomIncidentRepository,
            InvoiceRepository invoiceRepository,
            PaymentRepository paymentRepository
    ) {
        this.accountRepository = accountRepository;
        this.customerRepository = customerRepository;
        this.roomRepository = roomRepository;
        this.roomTypeRepository = roomTypeRepository;
        this.bookingRepository = bookingRepository;
        this.bookingDetailRepository = bookingDetailRepository;
        this.bookingGuestRepository = bookingGuestRepository;
        this.bookingServiceItemRepository = bookingServiceItemRepository;
        this.serviceUsageRepository = serviceUsageRepository;
        this.pricePolicyRepository = pricePolicyRepository;
        this.roomPriceConfigRepository = roomPriceConfigRepository;
        this.facilityServiceRepository = facilityServiceRepository;
        this.inventoryServiceRepository = inventoryServiceRepository;
        this.voucherRepository = voucherRepository;
        this.bookingCodeGenerator = bookingCodeGenerator;
        this.eventPublisher = eventPublisher;
        this.roomIncidentRepository = roomIncidentRepository;
        this.invoiceRepository = invoiceRepository;
        this.paymentRepository = paymentRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<PricePolicyResponse> getPricePolicies() {
        return pricePolicyRepository.findAll().stream()
                .sorted(Comparator.comparing(PricePolicy::getPolicyName, Comparator.nullsLast(String::compareToIgnoreCase)))
                .map(policy -> new PricePolicyResponse(
                        policy.getId(),
                        policy.getPolicyName(),
                        policy.getRentType(),
                        policy.getStandardCheckIn(),
                        policy.getStandardCheckOut(),
                        policy.getLimitHours()
                ))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PublicServiceOptionResponse> getServiceOptions() {
        List<PublicServiceOptionResponse> facilities = facilityServiceRepository.findAll().stream()
                .filter(FacilityService::isActive)
                .map(service -> new PublicServiceOptionResponse(service.getId(), service.getName(), service.getPrice(), "FACILITY", null, service.getImageUrl()))
                .toList();
        List<PublicServiceOptionResponse> inventories = inventoryServiceRepository.findAll().stream()
                .filter(service -> service.getQuantityInStock() == null || service.getQuantityInStock() > 0)
                .map(service -> new PublicServiceOptionResponse(service.getId(), service.getName(), service.getPrice(), "INVENTORY", service.getQuantityInStock(), service.getImageUrl()))
                .toList();
        return java.util.stream.Stream.concat(facilities.stream(), inventories.stream())
                .sorted(Comparator.comparing(PublicServiceOptionResponse::name, Comparator.nullsLast(String::compareToIgnoreCase)))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PublicBookingHistoryResponse> getMyBookings(String email) {
        return bookingDetailRepository.findByCustomerEmailForHistory(email).stream()
                .collect(Collectors.groupingBy(detail -> detail.getBooking().getId()))
                .values()
                .stream()
                .map(this::toHistoryResponse)
                .sorted(Comparator.comparing(PublicBookingHistoryResponse::bookingDate, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PublicBookingHistoryDetailResponse getMyBookingDetail(String email, Long bookingId) {
        List<BookingDetail> details = bookingDetailRepository.findByCustomerEmailAndBookingIdForHistory(email, bookingId);
        if (details.isEmpty()) {
            throw new IllegalArgumentException("KhÃƒÂ´ng tÃƒÂ¬m thÃ¡ÂºÂ¥y Ã„â€˜Ã†Â¡n Ã„â€˜Ã¡ÂºÂ·t phÃƒÂ²ng");
        }
        return toHistoryDetailResponse(details);
    }

    @Override
    @Transactional
    public PublicBookingHistoryDetailResponse confirmMyBooking(String email, Long bookingId) {
        Booking booking = findOwnedBookingForUpdate(email, bookingId);
        booking.setCustomerConfirmed(true);
        bookingRepository.save(booking);
        return getMyBookingDetail(email, bookingId);
    }

    @Override
    @Transactional
    public PublicBookingHistoryDetailResponse submitMyBookingFeedback(String email, Long bookingId, PublicBookingFeedbackRequest request) {
        Booking booking = findOwnedBookingForUpdate(email, bookingId);
        String feedback = request.feedback() != null ? request.feedback().trim() : "";
        if (feedback.isBlank()) {
            throw new IllegalArgumentException("Vui lòng nhập nội dung phản hồi");
        }
        booking.setCustomerFeedback(feedback);
        booking.setCustomerFeedbackAt(LocalDateTime.now());
        bookingRepository.save(booking);
        return getMyBookingDetail(email, bookingId);
    }

    private PublicBookingHistoryDetailResponse toHistoryDetailResponse(List<BookingDetail> details) {
        Booking booking = details.get(0).getBooking();
        BigDecimal roomCharge = calculateRoomCharge(details);
        List<Long> detailIds = details.stream().map(BookingDetail::getId).toList();
        List<BookingServiceItem> serviceItems = bookingServiceItemRepository.findByBookingDetailIds(detailIds);
        List<ServiceUsage> stayUsages = serviceUsageRepository.findByBookingIdForInvoice(booking.getId());
        BigDecimal serviceCharge = calculateServiceCharge(serviceItems).add(calculateServiceUsageCharge(stayUsages));
        BigDecimal totalAmount = roomCharge.add(serviceCharge);
        DepositPolicy depositPolicy = booking.getDepositPolicy();

        BigDecimal paidAmount = calculateBookingPaidAmount(booking);

        return new PublicBookingHistoryDetailResponse(
                booking.getId(),
                booking.getBookingCode(),
                booking.getBookingDate(),
                booking.getStatus(),
                booking.getVoucherCode(),
                booking.getVoucherDiscountType(),
                booking.getVoucherDiscountValue(),
                booking.getMemberDiscountPercent(),
                booking.getMemberDiscountAmount(),
                booking.getEarnedMemberPoints(),
                roomChargeBeforeDiscount(booking, details),
                zero(booking.getRoomDiscountAmount()),
                roomCharge,
                serviceCharge,
                totalAmount,
                requiresPayment(booking),
                depositPolicy != null ? depositPolicy.getPolicyName() : null,
                depositPolicy != null ? depositPolicy.getCalculationType() : null,
                depositPolicy != null ? depositPolicy.getPolicyValue() : null,
                calculateDepositAmount(depositPolicy, totalAmount),
                booking.isCustomerConfirmed(),
                booking.getCustomerFeedback(),
                booking.getCustomerFeedbackAt(),
                details.stream().map(this::toHistoryRoomResponse).toList(),
                Stream.concat(
                        serviceItems.stream().map(this::toHistoryServiceResponse),
                        stayUsages.stream().map(this::toHistoryServiceResponse)
                ).toList(),
                paidAmount,
                booking.getCancellationReason(),
                booking.getCancelledAt(),
                booking.getRefundRate(),
                booking.getRefundAmount() != null ? booking.getRefundAmount() : BigDecimal.ZERO,
                booking.getRefundStatus(),
                booking.getRefundInfo()
        );
    }

    private Booking findOwnedBookingForUpdate(String email, Long bookingId) {
        return bookingRepository.findByIdAndCustomerEmailForPublicUpdate(bookingId, email)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn đặt phòng"));
    }

    @Override
    @Transactional(isolation = Isolation.SERIALIZABLE)
    public PublicBookingResponse createBooking(String authenticatedEmail, PublicCreateBookingRequest request) {
        validateRange(request.checkInTarget(), request.checkOutTarget());

        Account account = findAuthenticatedCustomerAccount(authenticatedEmail);
        if (account == null && (request.email() == null || request.email().isBlank())) {
            throw new IllegalArgumentException("Vui long nhap email de nhan xac nhan dat phong");
        }
        Customer customer = findBookingCustomer(account, request);
        updateCustomer(customer, request);
        boolean memberBooking = account != null;

        List<PublicBookingRoomRequest> selectedRooms = requireSelectedRooms(request);
        int requestedRoomCount = selectedRooms.stream().mapToInt(this::quantityOf).sum();
        if (requestedRoomCount > 1 && request.services() != null && !request.services().isEmpty()) {
            throw new IllegalArgumentException("Vui lòng chọn phòng áp dụng cho từng dịch vụ");
        }
        Set<Long> selectedRoomTypeIds = selectedRooms.stream()
                .map(this::resolveRoomTypeId)
                .collect(Collectors.toCollection(HashSet::new));
        Map<Long, RoomType> roomTypesById = roomTypeRepository.findAllByIdForInventoryUpdate(selectedRoomTypeIds).stream()
                .collect(Collectors.toMap(RoomType::getId, roomType -> roomType));
        if (roomTypesById.size() != selectedRoomTypeIds.size()) {
            throw new IllegalArgumentException("Khong tim thay mot hoac nhieu loai phong da chon");
        }

        for (PublicBookingRoomRequest selectedRoom : selectedRooms) {
            RoomType roomType = roomTypesById.get(resolveRoomTypeId(selectedRoom));
            validateCapacity(roomType, selectedRoom.numberOfAdults(), selectedRoom.numberOfChildren());
        }
        validateRoomTypeAvailability(selectedRooms, roomTypesById, request.checkInTarget(), request.checkOutTarget());

        PricePolicy pricePolicy = null;
        if (request.pricePolicyId() != null) {
            pricePolicy = pricePolicyRepository.findById(request.pricePolicyId()).orElse(null);
        }
        if (pricePolicy == null) {
            pricePolicy = pricePolicyRepository.findAll().stream()
                    .filter(p -> "OVERNIGHT".equalsIgnoreCase(p.getRentType()) || "DAILY".equalsIgnoreCase(p.getRentType()))
                    .findFirst()
                    .orElseGet(() -> pricePolicyRepository.findAll().stream().findFirst().orElse(null));
        }
        if (pricePolicy != null) {
            validatePolicyTime(pricePolicy, request.checkInTarget(), request.checkOutTarget());
        }
        List<RoomBookingLine> roomLines = buildRoomBookingLines(selectedRooms, roomTypesById, request.checkInTarget(), request.checkOutTarget());
        BigDecimal roomChargeBeforeDiscount = roomLines.stream()
                .map(RoomBookingLine::price)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        VoucherDiscount voucherDiscount = resolveVoucherDiscount(request.voucherCode(), roomChargeBeforeDiscount);
        BigDecimal memberDiscountPercent = memberBooking ? currentMemberDiscountPercent(customer) : BigDecimal.ZERO;
        BigDecimal memberDiscountAmount = calculateMemberDiscountAmount(memberDiscountPercent, roomChargeBeforeDiscount.subtract(voucherDiscount.amount()));
        BigDecimal totalRoomDiscount = voucherDiscount.amount().add(memberDiscountAmount);
        applyAllocatedDiscounts(roomLines, totalRoomDiscount);
        DepositPolicy depositPolicy = selectedRooms.stream()
                .map(selectedRoom -> roomTypesById.get(resolveRoomTypeId(selectedRoom)))
                .filter(roomType -> roomType != null && roomType.getDepositPolicy() != null)
                .map(RoomType::getDepositPolicy)
                .findFirst()
                .orElse(null);
        boolean hourlyPrepaymentRequired = pricePolicy != null && isHourlyPolicy(pricePolicy);
        boolean requiresDeposit = hourlyPrepaymentRequired || depositPolicy != null;
        String bookingStatus = requiresDeposit ? "PENDING" : "CONFIRMED";

        LocalDateTime bookingDate = LocalDateTime.now();
        Booking booking = bookingRepository.save(Booking.builder()
                .bookingCode(bookingCodeGenerator.generate(bookingDate))
                .customer(customer)
                .depositPolicy(depositPolicy)
                .voucher(voucherDiscount.voucher())
                .voucherCode(voucherDiscount.code())
                .voucherDiscountType(voucherDiscount.discountType())
                .voucherDiscountValue(voucherDiscount.discountValue())
                .roomChargeBeforeDiscount(roomChargeBeforeDiscount)
                .roomDiscountAmount(totalRoomDiscount)
                .memberDiscountPercent(memberDiscountPercent)
                .memberDiscountAmount(memberDiscountAmount)
                .bookingDate(bookingDate)
                .status(bookingStatus)
                .build());
        markVoucherReserved(voucherDiscount.voucher());

        List<BookingDetail> savedDetails = new ArrayList<>();
        BigDecimal serviceCharge = BigDecimal.ZERO;
        for (RoomBookingLine line : roomLines) {
            PublicBookingRoomRequest selectedRoom = line.request();
            BookingDetail savedDetail = bookingDetailRepository.save(BookingDetail.builder()
                    .booking(booking)
                    .roomType(line.roomType())
                    .room(null)
                    .checkInTarget(request.checkInTarget())
                    .checkOutTarget(request.checkOutTarget())
                    .numberOfAdults(selectedRoom.numberOfAdults())
                    .numberOfChildren(selectedRoom.numberOfChildren())
                    .priceAtBooking(line.price())
                    .allocatedDiscount(line.allocatedDiscount())
                    .rentType(pricePolicy.getRentType())
                    .roomAssignmentStatus("UNASSIGNED")
                    .status(bookingStatus)
                    .build());
            savedDetails.add(savedDetail);
            serviceCharge = serviceCharge.add(saveServices(savedDetail, selectedRoom.services()));
        }

        BookingDetail firstDetail = savedDetails.get(0);
        BigDecimal roomCharge = calculateRoomCharge(savedDetails);
        if (request.services() != null && !request.services().isEmpty()) {
            serviceCharge = serviceCharge.add(saveServices(firstDetail, request.services()));
        }
        BigDecimal totalAmount = roomCharge.add(serviceCharge);
        BigDecimal depositAmount = hourlyPrepaymentRequired
                ? roomCharge
                : requiresDeposit ? calculateDepositAmount(depositPolicy, totalAmount) : BigDecimal.ZERO;
        savePrimaryBookingGuest(booking, firstDetail, customer, request.identityDocumentNumber());
        int earnedMemberPoints = memberBooking ? calculateEarnedMemberPoints(totalAmount) : 0;
        if (memberBooking) {
            addMemberPoints(customer, earnedMemberPoints);
            booking.setEarnedMemberPoints(earnedMemberPoints);
            bookingRepository.save(booking);
        }
        publishBookingConfirmationEmail(memberBooking, booking, customer, savedDetails, roomCharge, serviceCharge, totalAmount, requiresDeposit, depositAmount);

        // Sinh voucher may mắn ngẫu nhiên 5% - 10% cho khách hàng sử dụng lần sau
        int luckyPercent = java.util.concurrent.ThreadLocalRandom.current().nextInt(5, 11);
        String luckyCode = "LUCKY" + luckyPercent + "-" + java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 4).toUpperCase();
        LocalDateTime luckyExpiry = LocalDateTime.now().plusMonths(3);

        Voucher luckyVoucher = Voucher.builder()
                .code(luckyCode)
                .discountType("PERCENT")
                .discountValue(BigDecimal.valueOf(luckyPercent))
                .minOrderValue(BigDecimal.ZERO)
                .maxDiscountAmount(null)
                .startDate(LocalDateTime.now())
                .endDate(luckyExpiry)
                .usageLimit(1)
                .usedCount(0)
                .build();
        try {
            voucherRepository.save(luckyVoucher);
        } catch (Exception ignored) {
            String retryCode = "LUCKY" + luckyPercent + "-" + java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase();
            luckyVoucher.setCode(retryCode);
            try {
                voucherRepository.save(luckyVoucher);
                luckyCode = retryCode;
            } catch (Exception e) {
                luckyCode = null;
            }
        }

        return new PublicBookingResponse(
                booking.getId(),
                booking.getBookingCode(),
                firstDetail.getId(),
                null,
                null,
                booking.getStatus(),
                firstDetail.getCheckInTarget(),
                firstDetail.getCheckOutTarget(),
                booking.getVoucherCode(),
                booking.getVoucherDiscountType(),
                booking.getVoucherDiscountValue(),
                booking.getMemberDiscountPercent(),
                booking.getMemberDiscountAmount(),
                booking.getEarnedMemberPoints(),
                booking.getRoomChargeBeforeDiscount(),
                booking.getRoomDiscountAmount(),
                roomCharge,
                serviceCharge,
                totalAmount,
                savedDetails.stream().map(this::toPublicBookingRoomResponse).toList(),
                requiresDeposit,
                hourlyPrepaymentRequired ? "Thanh toan 100% gio dau tien" : depositPolicy != null ? depositPolicy.getPolicyName() : null,
                hourlyPrepaymentRequired ? "PERCENTAGE" : depositPolicy != null ? depositPolicy.getCalculationType() : null,
                hourlyPrepaymentRequired ? BigDecimal.valueOf(100) : depositPolicy != null ? depositPolicy.getPolicyValue() : null,
                depositAmount,
                luckyCode,
                luckyCode != null ? BigDecimal.valueOf(luckyPercent) : null,
                luckyExpiry
        );
    }

    private Account findAuthenticatedCustomerAccount(String authenticatedEmail) {
        if (authenticatedEmail == null || authenticatedEmail.isBlank()) {
            return null;
        }
        Account account = accountRepository.findByEmail(authenticatedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay tai khoan"));
        if (account.getRole() == null || !"ROLE_CUSTOMER".equals(account.getRole().getName())) {
            throw new IllegalArgumentException("Chi tai khoan khach hang moi co the dat phong");
        }
        return account;
    }

    private void publishBookingConfirmationEmail(
            boolean memberBooking,
            Booking booking,
            Customer customer,
            List<BookingDetail> savedDetails,
            BigDecimal roomCharge,
            BigDecimal serviceCharge,
            BigDecimal totalAmount,
            boolean requiresDeposit,
            BigDecimal depositAmount
    ) {
        if (memberBooking || requiresDeposit || customer.getEmail() == null || customer.getEmail().isBlank()) {
            return;
        }
        eventPublisher.publishEvent(new PublicBookingConfirmationEmailEvent(
                customer.getEmail(),
                customer.getFullName(),
                booking.getBookingCode(),
                savedDetails.stream().map(BookingDetail::getCheckInTarget).min(LocalDateTime::compareTo).orElse(null),
                savedDetails.stream().map(BookingDetail::getCheckOutTarget).max(LocalDateTime::compareTo).orElse(null),
                roomCharge,
                serviceCharge,
                totalAmount,
                requiresDeposit,
                depositAmount,
                false,
                savedDetails.stream().map(detail -> new PublicBookingConfirmationEmailEvent.RoomLine(
                        roomTypeName(detail),
                        detail.getNumberOfAdults(),
                        detail.getNumberOfChildren(),
                        finalRoomAmount(detail)
                )).toList()
        ));
    }

    private String roomTypeName(BookingDetail detail) {
        Room room = detail.getRoom();
        RoomType roomType = detail.getRoomType() != null ? detail.getRoomType() : room != null ? room.getRoomType() : null;
        return roomType != null ? roomType.getName() : "Phong da dat";
    }

    private Customer findBookingCustomer(Account account, PublicCreateBookingRequest request) {
        if (account != null) {
            return customerRepository.findByAccountId(account.getId())
                    .orElseGet(() -> Customer.builder()
                            .account(account)
                            .email(account.getEmail())
                            .fullName(request.fullName().trim())
                            .build());
        }
        return Customer.builder()
                .email(blankToNull(request.email()))
                .fullName(request.fullName().trim())
                .build();
    }

    private List<PublicBookingRoomRequest> requireSelectedRooms(PublicCreateBookingRequest request) {
        if (request.rooms() != null && !request.rooms().isEmpty()) {
            return request.rooms();
        }
        if (request.roomTypeId() != null) {
            return List.of(new PublicBookingRoomRequest(
                    null,
                    request.roomTypeId(),
                    1,
                    request.numberOfAdults(),
                    request.numberOfChildren(),
                    null
            ));
        }
        if (request.roomId() != null) {
            Room room = roomRepository.findById(request.roomId())
                    .orElseThrow(() -> new IllegalArgumentException("Khong tim thay phong da chon"));
            return List.of(new PublicBookingRoomRequest(
                    room.getId(),
                    room.getRoomType().getId(),
                    1,
                    request.numberOfAdults(),
                    request.numberOfChildren(),
                    null
            ));
        }
        throw new IllegalArgumentException("Vui long chon it nhat mot loai phong");
    }

    private Long resolveRoomTypeId(PublicBookingRoomRequest selectedRoom) {
        if (selectedRoom.roomTypeId() != null) {
            return selectedRoom.roomTypeId();
        }
        if (selectedRoom.roomId() != null) {
            return roomRepository.findById(selectedRoom.roomId())
                    .map(room -> room.getRoomType().getId())
                    .orElseThrow(() -> new IllegalArgumentException("Khong tim thay phong da chon"));
        }
        throw new IllegalArgumentException("Vui long chon loai phong");
    }

    private int quantityOf(PublicBookingRoomRequest selectedRoom) {
        return selectedRoom.quantity() != null && selectedRoom.quantity() > 0 ? selectedRoom.quantity() : 1;
    }

    private void validateRoomTypeAvailability(
            List<PublicBookingRoomRequest> selectedRooms,
            Map<Long, RoomType> roomTypesById,
            LocalDateTime checkInTarget,
            LocalDateTime checkOutTarget
    ) {
        Map<Long, Long> bookedCountByType = bookingDetailRepository.findOverlappingSchedule(checkInTarget, checkOutTarget)
                .stream()
                .filter(this::isActive)
                .filter(detail -> detail.getRoomType() != null)
                .collect(Collectors.groupingBy(detail -> detail.getRoomType().getId(), Collectors.counting()));
        Map<Long, Integer> requestedCountByType = selectedRooms.stream()
                .collect(Collectors.groupingBy(
                        this::resolveRoomTypeId,
                        Collectors.summingInt(this::quantityOf)
                ));

        java.util.Set<Long> inProgressRoomIds = new java.util.HashSet<>(roomIncidentRepository.findRoomIdsWithInProgressIncidents());
        for (Map.Entry<Long, Integer> entry : requestedCountByType.entrySet()) {
            Long roomTypeId = entry.getKey();
            int requestedQuantity = entry.getValue();
            int totalRooms = (int) roomRepository.findByRoomTypeId(roomTypeId).stream()
                    .filter(r -> !"MAINTENANCE".equalsIgnoreCase(r.getStatus()) && !inProgressRoomIds.contains(r.getId()))
                    .count();
            long bookedRooms = bookedCountByType.getOrDefault(roomTypeId, 0L);
            int availableRooms = Math.max(0, (int) (totalRooms - bookedRooms));
            if (availableRooms < requestedQuantity) {
                RoomType roomType = roomTypesById.get(roomTypeId);
                if (totalRooms == 0) {
                    throw new IllegalArgumentException("Loại phòng " + roomType.getName() + " hiện đang có sự cố/bảo trì, tạm thời không thể nhận đặt");
                }
                throw new IllegalArgumentException("Loại phòng " + roomType.getName() + " chỉ còn " + availableRooms + " phòng trong khoảng thời gian này");
            }
        }
    }

    private void savePrimaryBookingGuest(Booking booking, BookingDetail firstDetail, Customer customer, String identityDocumentNumber) {
        if (identityDocumentNumber == null || identityDocumentNumber.isBlank()) {
            return;
        }
        bookingGuestRepository.save(BookingGuest.builder()
                .booking(booking)
                .bookingDetail(firstDetail)
                .fullName(customer.getFullName())
                .identityDocumentType("CCCD")
                .identityDocumentNumber(identityDocumentNumber.trim())
                .dateOfBirth(customer.getDateOfBirth())
                .phone(customer.getPhone())
                .address(customer.getAddress())
                .primaryGuest(true)
                .note("Nguoi dat phong cung cap CCCD khi tao booking online")
                .build());
    }

    private PublicBookingRoomResponse toPublicBookingRoomResponse(BookingDetail detail) {
        Room room = detail.getRoom();
        RoomType roomType = detail.getRoomType() != null ? detail.getRoomType() : room != null ? room.getRoomType() : null;
        return new PublicBookingRoomResponse(
                detail.getId(),
                room != null ? room.getId() : null,
                room != null ? room.getRoomNumber() : null,
                roomType != null ? roomType.getName() : null,
                detail.getNumberOfAdults(),
                detail.getNumberOfChildren(),
                detail.getPriceAtBooking(),
                zero(detail.getAllocatedDiscount()),
                finalRoomAmount(detail),
                detail.getRentType()
        );
    }

    private void validateRange(LocalDateTime checkInTarget, LocalDateTime checkOutTarget) {
        if (checkInTarget == null || checkOutTarget == null) {
            throw new IllegalArgumentException("Vui lòng chọn giờ nhận và trả phòng");
        }
        if (!checkOutTarget.isAfter(checkInTarget)) {
            throw new IllegalArgumentException("Giờ trả phòng phải sau giờ nhận phòng");
        }
    }

    void validatePolicyTime(PricePolicy policy, LocalDateTime checkInTarget, LocalDateTime checkOutTarget) {
        String rentType = normalize(policy.getRentType());
        if (Set.of("HOURLY", "BY_HOUR", "COMBO").contains(rentType)) {
            int limitHours = policy.getLimitHours() != null && policy.getLimitHours() > 0 ? policy.getLimitHours() : 1;
            LocalDateTime expectedCheckOut = checkInTarget.plusHours(limitHours);
            if (!checkOutTarget.equals(expectedCheckOut)) {
                throw new IllegalArgumentException("Gói theo giờ/combo chỉ cần chọn giờ nhận phòng, giờ trả phòng sẽ được hệ thống tự tính");
            }
        }
    }

    private boolean isHourlyPolicy(PricePolicy policy) {
        String rentType = normalize(policy.getRentType());
        return Set.of("HOURLY", "BY_HOUR").contains(rentType);
    }

    private void updateCustomer(Customer customer, PublicCreateBookingRequest request) {
        customer.setFullName(request.fullName().trim());
        if (customer.getAccount() != null) {
            customer.setEmail(customer.getAccount().getEmail());
        } else {
            customer.setEmail(blankToNull(request.email()));
        }
        customer.setPhone(request.phone().trim());
        customer.setAddress(request.address() != null && !request.address().isBlank() ? request.address().trim() : null);
        customer.setDateOfBirth(request.dateOfBirth());
        customer.setIdentityDocumentNumber(blankToNull(request.identityDocumentNumber()));
        customerRepository.save(customer);
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private BigDecimal currentMemberDiscountPercent(Customer customer) {
        int points = customer.getMemberPoints() == null ? 0 : customer.getMemberPoints();
        int discountPercent = Math.min(15, points / 10);
        return BigDecimal.valueOf(discountPercent);
    }

    private BigDecimal calculateMemberDiscountAmount(BigDecimal memberDiscountPercent, BigDecimal eligibleAmount) {
        if (memberDiscountPercent == null || memberDiscountPercent.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        if (eligibleAmount == null || eligibleAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        return eligibleAmount.multiply(memberDiscountPercent)
                .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP)
                .min(eligibleAmount)
                .setScale(0, RoundingMode.HALF_UP);
    }

    private int calculateEarnedMemberPoints(BigDecimal totalAmount) {
        if (totalAmount == null || totalAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return 0;
        }
        int points = totalAmount.divide(BigDecimal.valueOf(1_000_000), 0, RoundingMode.DOWN).intValue();
        return Math.max(1, points);
    }

    private void addMemberPoints(Customer customer, int earnedMemberPoints) {
        if (earnedMemberPoints <= 0) {
            return;
        }
        int currentPoints = customer.getMemberPoints() == null ? 0 : customer.getMemberPoints();
        int nextPoints = currentPoints + earnedMemberPoints;
        customer.setMemberPoints(nextPoints);
        customer.setMemberDiscountPercent(BigDecimal.valueOf(Math.min(15, nextPoints / 10)));
        customerRepository.save(customer);
    }

    private void validateCapacity(RoomType roomType, Integer adults, Integer children) {
        if (roomType == null) {
            throw new IllegalArgumentException("Phòng chưa có loại phòng");
        }
        if (adults > roomType.getMaxAdults() || children > roomType.getMaxChildren()) {
            throw new IllegalArgumentException("Số khách vượt quá sức chứa của phòng");
        }
    }

    private void ensureRoomAvailable(Room room, LocalDateTime checkInTarget, LocalDateTime checkOutTarget) {
        boolean busy = bookingDetailRepository.findOverlappingSchedule(checkInTarget, checkOutTarget).stream()
                .filter(detail -> detail.getRoom() != null && room.getId().equals(detail.getRoom().getId()))
                .anyMatch(this::isActive);
        if (busy) {
            throw new IllegalArgumentException("Phòng đã có booking trong khung giờ này");
        }
    }

    private boolean isActive(BookingDetail detail) {
        return BookingInventoryPolicy.blocksInventory(detail);
    }

    private PublicBookingHistoryResponse toHistoryResponse(List<BookingDetail> details) {
        Booking booking = details.get(0).getBooking();
        BookingDetail firstDetail = details.stream()
                .min(Comparator.comparing(BookingDetail::getCheckInTarget))
                .orElse(details.get(0));
        BigDecimal roomCharge = calculateRoomCharge(details);
        List<Long> detailIds = details.stream().map(BookingDetail::getId).toList();
        BigDecimal serviceCharge = calculateServiceCharge(bookingServiceItemRepository.findByBookingDetailIds(detailIds))
                .add(calculateServiceUsageCharge(serviceUsageRepository.findByBookingIdForInvoice(booking.getId())));
        BigDecimal totalAmount = roomCharge.add(serviceCharge);
        DepositPolicy depositPolicy = booking.getDepositPolicy();
        Room room = firstDetail.getRoom();
        RoomType roomType = firstDetail.getRoomType() != null ? firstDetail.getRoomType() : room != null ? room.getRoomType() : null;

        return new PublicBookingHistoryResponse(
                booking.getId(),
                booking.getBookingCode(),
                booking.getBookingDate(),
                booking.getStatus(),
                room != null ? room.getRoomNumber() : null,
                roomType != null ? roomType.getName() : null,
                firstDetail.getCheckInTarget(),
                details.stream().map(BookingDetail::getCheckOutTarget).max(LocalDateTime::compareTo).orElse(firstDetail.getCheckOutTarget()),
                details.size(),
                booking.getVoucherCode(),
                booking.getMemberDiscountPercent(),
                booking.getMemberDiscountAmount(),
                booking.getEarnedMemberPoints(),
                roomChargeBeforeDiscount(booking, details),
                zero(booking.getRoomDiscountAmount()),
                roomCharge,
                serviceCharge,
                totalAmount,
                requiresPayment(booking),
                depositPolicy != null ? depositPolicy.getPolicyName() : null,
                depositPolicy != null ? depositPolicy.getCalculationType() : null,
                depositPolicy != null ? depositPolicy.getPolicyValue() : null,
                calculateDepositAmount(depositPolicy, totalAmount),
                booking.isCustomerConfirmed(),
                booking.getCustomerFeedback(),
                booking.getCustomerFeedbackAt(),
                booking.getCancellationReason(),
                booking.getCancelledAt(),
                booking.getRefundRate(),
                booking.getRefundAmount() != null ? booking.getRefundAmount() : BigDecimal.ZERO,
                booking.getRefundStatus()
        );
    }

    private PublicBookingHistoryRoomResponse toHistoryRoomResponse(BookingDetail detail) {
        Room room = detail.getRoom();
        RoomType roomType = detail.getRoomType() != null ? detail.getRoomType() : room != null ? room.getRoomType() : null;
        return new PublicBookingHistoryRoomResponse(
                detail.getId(),
                room != null ? room.getId() : null,
                room != null ? room.getRoomNumber() : null,
                roomType != null ? roomType.getName() : null,
                detail.getCheckInTarget(),
                detail.getCheckOutTarget(),
                detail.getNumberOfAdults(),
                detail.getNumberOfChildren(),
                detail.getPriceAtBooking(),
                zero(detail.getAllocatedDiscount()),
                finalRoomAmount(detail),
                detail.getRentType(),
                detail.getStatus(),
                detail.getExtensionHours() != null ? detail.getExtensionHours() : 0,
                safeExtensionAmount(detail)
        );
    }

    private PublicBookingHistoryServiceResponse toHistoryServiceResponse(BookingServiceItem item) {
        String name = item.getFacilityService() != null
                ? item.getFacilityService().getName()
                : item.getInventoryService().getName();
        String type = item.getFacilityService() != null ? "FACILITY" : "INVENTORY";
        BigDecimal total = item.getPriceAtBooking().multiply(BigDecimal.valueOf(item.getQuantity()));
        return new PublicBookingHistoryServiceResponse(
                item.getId(),
                "PRE_BOOKED",
                item.getBookingDetail().getId(),
                name,
                type,
                item.getQuantity(),
                item.getPriceAtBooking(),
                total
        );
    }

    private PublicBookingHistoryServiceResponse toHistoryServiceResponse(ServiceUsage usage) {
        boolean facility = usage.getFacilityService() != null;
        String name = facility
                ? usage.getFacilityService().getName()
                : usage.getInventoryService().getName();
        String type = facility ? "FACILITY" : "INVENTORY";
        BigDecimal total = usage.getPriceAtUse().multiply(BigDecimal.valueOf(usage.getQuantity()));
        return new PublicBookingHistoryServiceResponse(
                usage.getId(),
                "STAY",
                usage.getCheckInRecord().getBookingDetail().getId(),
                name,
                type,
                usage.getQuantity(),
                usage.getPriceAtUse(),
                total
        );
    }

    private BigDecimal calculateRoomCharge(List<BookingDetail> details) {
        return details.stream()
                .map(this::finalRoomAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal roomChargeBeforeDiscount(Booking booking, List<BookingDetail> details) {
        if (booking.getRoomChargeBeforeDiscount() != null
                && booking.getRoomChargeBeforeDiscount().compareTo(BigDecimal.ZERO) > 0) {
            return booking.getRoomChargeBeforeDiscount();
        }
        return details.stream()
                .map(BookingDetail::getPriceAtBooking)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal finalRoomAmount(BookingDetail detail) {
        BigDecimal finalAmount = zero(detail.getPriceAtBooking()).subtract(zero(detail.getAllocatedDiscount()));
        return finalAmount.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : finalAmount;
    }

    private BigDecimal zero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private List<RoomBookingLine> buildRoomBookingLines(
            List<PublicBookingRoomRequest> selectedRooms,
            Map<Long, RoomType> roomTypesById,
            LocalDateTime checkInTarget,
            LocalDateTime checkOutTarget
    ) {
        List<RoomBookingLine> lines = new ArrayList<>();
        for (PublicBookingRoomRequest selectedRoom : selectedRooms) {
            RoomType roomType = roomTypesById.get(resolveRoomTypeId(selectedRoom));
            BigDecimal currentRoomPrice = calculateRoomTypePriceForRange(roomType.getId(), checkInTarget, checkOutTarget);
            for (int index = 0; index < quantityOf(selectedRoom); index++) {
                lines.add(new RoomBookingLine(selectedRoom, roomType, currentRoomPrice));
            }
        }
        return lines;
    }

    private BigDecimal calculateRoomTypePriceForRange(Long roomTypeId, LocalDateTime checkIn, LocalDateTime checkOut) {
        LocalDate start = checkIn != null ? checkIn.toLocalDate() : LocalDate.now();
        LocalDate end = checkOut != null ? checkOut.toLocalDate() : start.plusDays(1);
        if (!end.isAfter(start)) {
            end = start.plusDays(1);
        }

        BigDecimal weekdayPrice = getRoomTypePriceForDayType(roomTypeId, "WEEKDAY");
        BigDecimal weekendPrice = getRoomTypePriceForDayType(roomTypeId, "WEEKEND");
        if (weekendPrice == null || weekendPrice.compareTo(BigDecimal.ZERO) <= 0) {
            weekendPrice = weekdayPrice;
        }

        BigDecimal total = BigDecimal.ZERO;
        LocalDate curr = start;
        while (curr.isBefore(end)) {
            java.time.DayOfWeek dow = curr.getDayOfWeek();
            boolean isWeekend = (dow == java.time.DayOfWeek.SATURDAY || dow == java.time.DayOfWeek.SUNDAY);
            BigDecimal nightPrice = isWeekend ? weekendPrice : weekdayPrice;
            total = total.add(nightPrice);
            curr = curr.plusDays(1);
        }
        return total;
    }

    private BigDecimal getRoomTypePriceForDayType(Long roomTypeId, String dayType) {
        return roomPriceConfigRepository.findByRoomTypeIdAndDayType(roomTypeId, dayType).stream()
                .map(RoomPriceConfig::getPrice)
                .filter(Objects::nonNull)
                .filter(p -> p.compareTo(BigDecimal.ZERO) > 0)
                .min(BigDecimal::compareTo)
                .orElseGet(() -> roomPriceConfigRepository.findByRoomTypeId(roomTypeId).stream()
                        .map(RoomPriceConfig::getPrice)
                        .filter(Objects::nonNull)
                        .filter(p -> p.compareTo(BigDecimal.ZERO) > 0)
                        .findFirst()
                        .orElse(BigDecimal.valueOf(500000)));
    }

    private VoucherDiscount resolveVoucherDiscount(String voucherCode, BigDecimal roomChargeBeforeDiscount) {
        if (voucherCode == null || voucherCode.isBlank()) {
            return VoucherDiscount.empty();
        }
        Voucher voucher = voucherRepository.findByCodeIgnoreCase(voucherCode.trim())
                .orElseThrow(() -> new IllegalArgumentException("Ma voucher khong ton tai"));
        LocalDateTime now = LocalDateTime.now();
        if (voucher.getStartDate() != null && voucher.getStartDate().isAfter(now)) {
            throw new IllegalArgumentException("Voucher chua den thoi gian ap dung");
        }
        if (voucher.getEndDate() != null && voucher.getEndDate().isBefore(now)) {
            throw new IllegalArgumentException("Voucher da het han");
        }
        int used = voucher.getUsedCount() == null ? 0 : voucher.getUsedCount();
        if (voucher.getUsageLimit() != null && used >= voucher.getUsageLimit()) {
            throw new IllegalArgumentException("Voucher da het luot su dung");
        }
        BigDecimal minOrderValue = zero(voucher.getMinOrderValue());
        if (roomChargeBeforeDiscount.compareTo(minOrderValue) < 0) {
            throw new IllegalArgumentException("Tong tien phong chua dat dieu kien voucher");
        }
        BigDecimal discountAmount = calculateVoucherAmount(voucher, roomChargeBeforeDiscount);
        if (discountAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Voucher khong co gia tri giam hop le");
        }
        return new VoucherDiscount(
                voucher,
                voucher.getCode(),
                normalize(voucher.getDiscountType()),
                voucher.getDiscountValue(),
                discountAmount
        );
    }

    private BigDecimal calculateVoucherAmount(Voucher voucher, BigDecimal roomChargeBeforeDiscount) {
        BigDecimal discountValue = zero(voucher.getDiscountValue());
        BigDecimal discountAmount;
        if ("PERCENT".equals(normalize(voucher.getDiscountType()))) {
            discountAmount = roomChargeBeforeDiscount.multiply(discountValue)
                    .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
        } else {
            discountAmount = discountValue.setScale(0, RoundingMode.HALF_UP);
        }
        BigDecimal maxDiscount = voucher.getMaxDiscountAmount();
        if (maxDiscount != null && maxDiscount.compareTo(BigDecimal.ZERO) > 0) {
            discountAmount = discountAmount.min(maxDiscount);
        }
        return discountAmount.min(roomChargeBeforeDiscount).setScale(0, RoundingMode.HALF_UP);
    }

    private void applyAllocatedDiscounts(List<RoomBookingLine> roomLines, BigDecimal discountAmount) {
        if (roomLines.isEmpty() || discountAmount == null || discountAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }
        BigDecimal roomTotal = roomLines.stream()
                .map(RoomBookingLine::price)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal allocated = BigDecimal.ZERO;
        for (int index = 0; index < roomLines.size(); index++) {
            RoomBookingLine line = roomLines.get(index);
            BigDecimal lineDiscount = index == roomLines.size() - 1
                    ? discountAmount.subtract(allocated)
                    : discountAmount.multiply(line.price())
                            .divide(roomTotal, 0, RoundingMode.HALF_UP);
            line.setAllocatedDiscount(lineDiscount.min(line.price()));
            allocated = allocated.add(line.allocatedDiscount());
        }
    }

    private void markVoucherReserved(Voucher voucher) {
        if (voucher == null) {
            return;
        }
        voucher.setUsedCount((voucher.getUsedCount() == null ? 0 : voucher.getUsedCount()) + 1);
        voucherRepository.save(voucher);
    }

    private BigDecimal calculateServiceCharge(List<BookingServiceItem> services) {
        return services.stream()
                .map(item -> item.getPriceAtBooking().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal calculateServiceUsageCharge(List<ServiceUsage> services) {
        return services.stream()
                .map(item -> item.getPriceAtUse().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private boolean requiresPayment(Booking booking) {
        return "PENDING".equals(normalize(booking.getStatus()));
    }

    private BigDecimal saveServices(BookingDetail detail, List<PublicBookingServiceRequest> services) {
        if (services == null || services.isEmpty()) {
            return BigDecimal.ZERO;
        }
        BigDecimal total = BigDecimal.ZERO;
        for (PublicBookingServiceRequest request : services) {
            String type = normalize(request.type());
            int quantity = request.quantity();
            if ("FACILITY".equals(type)) {
                FacilityService service = facilityServiceRepository.findById(request.serviceId())
                        .filter(FacilityService::isActive)
                        .orElseThrow(() -> new IllegalArgumentException("DÃ¡Â»â€¹ch vÃ¡Â»Â¥ khÃƒÂ´ng hÃ¡Â»Â£p lÃ¡Â»â€¡"));
                bookingServiceItemRepository.save(BookingServiceItem.builder()
                        .bookingDetail(detail)
                        .facilityService(service)
                        .quantity(quantity)
                        .priceAtBooking(service.getPrice())
                        .build());
                total = total.add(service.getPrice().multiply(BigDecimal.valueOf(quantity)));
            } else if ("INVENTORY".equals(type)) {
                InventoryService service = inventoryServiceRepository.findById(request.serviceId())
                        .orElseThrow(() -> new IllegalArgumentException("DÃ¡Â»â€¹ch vÃ¡Â»Â¥ thuÃƒÂª Ã„â€˜Ã¡Â»â€œ khÃƒÂ´ng hÃ¡Â»Â£p lÃ¡Â»â€¡"));
                if (service.getQuantityInStock() != null && quantity > service.getQuantityInStock()) {
                    throw new IllegalArgumentException("SÃ¡Â»â€˜ lÃ†Â°Ã¡Â»Â£ng dÃ¡Â»â€¹ch vÃ¡Â»Â¥ vÃ†Â°Ã¡Â»Â£t tÃ¡Â»â€œn kho");
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
                total = total.add(service.getPrice().multiply(BigDecimal.valueOf(quantity)));
            } else {
                throw new IllegalArgumentException("LoÃ¡ÂºÂ¡i dÃ¡Â»â€¹ch vÃ¡Â»Â¥ khÃƒÂ´ng hÃ¡Â»Â£p lÃ¡Â»â€¡");
            }
        }
        return total;
    }

    private boolean isWeekend(LocalDateTime dateTime) {
        DayOfWeek day = dateTime.getDayOfWeek();
        return day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY;
    }

    private BigDecimal calculateDepositAmount(DepositPolicy policy, BigDecimal totalAmount) {
        if (policy == null || policy.getPolicyValue() == null) {
            return BigDecimal.ZERO;
        }
        if ("PERCENTAGE".equals(normalize(policy.getCalculationType()))) {
            return totalAmount.multiply(policy.getPolicyValue())
                    .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
        }
        return policy.getPolicyValue();
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase();
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
    public PublicBookingExtensionCheckResponse checkExtension(String email, Long bookingId, PublicBookingExtensionCheckRequest request) {
        Booking booking = findOwnedBookingForUpdate(email, bookingId);
        List<BookingDetail> details = bookingDetailRepository.findByBookingId(booking.getId());
        if (details.isEmpty()) {
            throw new IllegalArgumentException("Không tìm thấy thông tin phòng trong đơn đặt phòng");
        }

        BookingDetail detail = request.bookingDetailId() != null
                ? details.stream().filter(d -> d.getId().equals(request.bookingDetailId())).findFirst()
                        .orElse(details.get(0))
                : details.get(0);

        LocalDateTime currentCheckOut = detail.getCheckOutTarget();
        if (currentCheckOut == null) {
            currentCheckOut = LocalDateTime.now().plusHours(2);
        }

        int addHours = request.additionalHours() != null && request.additionalHours() > 0 ? request.additionalHours() : 1;
        LocalDateTime newCheckOut = request.targetCheckOut() != null ? request.targetCheckOut() : currentCheckOut.plusHours(addHours);

        if (!newCheckOut.isAfter(currentCheckOut)) {
            throw new IllegalArgumentException("Thời gian trả phòng mới phải sau thời gian trả phòng hiện tại");
        }

        long actualHours = Math.max(1, java.time.Duration.between(currentCheckOut, newCheckOut).toHours());
        Room currentRoom = detail.getRoom();
        RoomType roomType = detail.getRoomType() != null ? detail.getRoomType() : (currentRoom != null ? currentRoom.getRoomType() : null);

        Set<Long> inProgressRoomIds = new HashSet<>(roomIncidentRepository.findRoomIdsWithInProgressIncidents());
        boolean currentRoomAvailable = false;

        if (currentRoom != null && !"MAINTENANCE".equalsIgnoreCase(currentRoom.getStatus()) && !inProgressRoomIds.contains(currentRoom.getId())) {
            boolean hasConflict = bookingDetailRepository.findOverlappingSchedule(currentCheckOut, newCheckOut)
                    .stream()
                    .filter(this::isActive)
                    .filter(d -> !d.getId().equals(detail.getId()))
                    .anyMatch(d -> d.getRoom() != null && d.getRoom().getId().equals(currentRoom.getId()));
            currentRoomAvailable = !hasConflict;
        }

        BigDecimal hourlyRate = calculateHourlyRate(roomType, detail);
        BigDecimal extensionFee = hourlyRate.multiply(BigDecimal.valueOf(actualHours));

        List<AlternativeRoomOptionResponse> alternativeRooms = new ArrayList<>();
        if (!currentRoomAvailable) {
            Set<Long> occupiedRoomIds = bookingDetailRepository.findOverlappingSchedule(currentCheckOut, newCheckOut)
                    .stream()
                    .filter(this::isActive)
                    .filter(d -> !d.getId().equals(detail.getId()) && d.getRoom() != null)
                    .map(d -> d.getRoom().getId())
                    .collect(Collectors.toSet());

            alternativeRooms = roomRepository.findAll().stream()
                    .filter(r -> !"MAINTENANCE".equalsIgnoreCase(r.getStatus()) && !inProgressRoomIds.contains(r.getId()))
                    .filter(r -> !occupiedRoomIds.contains(r.getId()))
                    .filter(r -> currentRoom == null || !r.getId().equals(currentRoom.getId()))
                    .map(r -> {
                        BigDecimal altHourly = calculateHourlyRate(r.getRoomType(), null);
                        BigDecimal altTotal = altHourly.multiply(BigDecimal.valueOf(actualHours));
                        String img = null;
                        return new AlternativeRoomOptionResponse(
                                r.getId(),
                                r.getRoomNumber(),
                                r.getRoomType() != null ? r.getRoomType().getId() : null,
                                r.getRoomType() != null ? r.getRoomType().getName() : "Phòng tiêu chuẩn",
                                altHourly,
                                altTotal,
                                r.getRoomType() != null ? r.getRoomType().getMaxAdults() : 2,
                                r.getRoomType() != null ? r.getRoomType().getMaxChildren() : 1,
                                img
                        );
                    })
                    .toList();
        }

        String roomName = currentRoom != null ? "Phòng " + currentRoom.getRoomNumber() : (roomType != null ? roomType.getName() : "Phòng hiện tại");
        String message = currentRoomAvailable
                ? roomName + " còn trống trong khung giờ này! Bạn có thể gia hạn trực tiếp."
                : roomName + " đã có khách đặt trước cho khung giờ tiếp theo nên không thể gia hạn tại chỗ. Bạn có thể chọn đổi sang phòng khác còn trống hoặc trả phòng đúng giờ.";

        return new PublicBookingExtensionCheckResponse(
                currentRoomAvailable,
                currentRoomAvailable,
                detail.getId(),
                currentRoom != null ? currentRoom.getId() : null,
                currentRoom != null ? currentRoom.getRoomNumber() : null,
                roomType != null ? roomType.getName() : null,
                currentCheckOut,
                newCheckOut,
                (int) actualHours,
                extensionFee,
                message,
                alternativeRooms
        );
    }

    @Override
    @Transactional
    public PublicBookingHistoryDetailResponse extendStay(String email, Long bookingId, PublicBookingExtendRequest request) {
        Booking booking = findOwnedBookingForUpdate(email, bookingId);
        List<BookingDetail> details = bookingDetailRepository.findByBookingId(booking.getId());
        if (details.isEmpty()) {
            throw new IllegalArgumentException("Không tìm thấy chi tiết phòng cần gia hạn");
        }

        BookingDetail detail = request.bookingDetailId() != null
                ? details.stream().filter(d -> d.getId().equals(request.bookingDetailId())).findFirst().orElse(details.get(0))
                : details.get(0);

        LocalDateTime currentCheckOut = detail.getCheckOutTarget();
        if (currentCheckOut == null) {
            currentCheckOut = LocalDateTime.now().plusHours(2);
        }

        int addHours = request.additionalHours() != null && request.additionalHours() > 0 ? request.additionalHours() : 1;
        LocalDateTime newCheckOut = request.targetCheckOut() != null ? request.targetCheckOut() : currentCheckOut.plusHours(addHours);

        if (!newCheckOut.isAfter(currentCheckOut)) {
            throw new IllegalArgumentException("Thời gian trả phòng mới phải sau thời gian trả phòng hiện tại");
        }

        long actualHours = Math.max(1, java.time.Duration.between(currentCheckOut, newCheckOut).toHours());
        Set<Long> inProgressRoomIds = new HashSet<>(roomIncidentRepository.findRoomIdsWithInProgressIncidents());

        if (request.switchRoomId() != null) {
            Room switchRoom = roomRepository.findById(request.switchRoomId())
                    .orElseThrow(() -> new IllegalArgumentException("Phòng chuyển đổi không tồn tại"));

            if ("MAINTENANCE".equalsIgnoreCase(switchRoom.getStatus()) || inProgressRoomIds.contains(switchRoom.getId())) {
                throw new IllegalArgumentException("Phòng chuyển đổi hiện đang bảo trì, vui lòng chọn phòng khác");
            }

            boolean isSwitchRoomOccupied = bookingDetailRepository.findOverlappingSchedule(currentCheckOut, newCheckOut)
                    .stream()
                    .filter(this::isActive)
                    .anyMatch(d -> d.getRoom() != null && d.getRoom().getId().equals(switchRoom.getId()));

            if (isSwitchRoomOccupied) {
                throw new IllegalArgumentException("Phòng " + switchRoom.getRoomNumber() + " vừa có khách khác đặt trong khung giờ này, vui lòng chọn phòng khác");
            }

            BigDecimal switchHourly = calculateHourlyRate(switchRoom.getRoomType(), null);
            BigDecimal switchFee = switchHourly.multiply(BigDecimal.valueOf(actualHours));

            BookingDetail switchDetail = BookingDetail.builder()
                    .booking(booking)
                    .room(switchRoom)
                    .roomType(switchRoom.getRoomType())
                    .checkInTarget(currentCheckOut)
                    .checkOutTarget(newCheckOut)
                    .numberOfAdults(detail.getNumberOfAdults())
                    .numberOfChildren(detail.getNumberOfChildren())
                    .priceAtBooking(switchFee)
                    .allocatedDiscount(BigDecimal.ZERO)
                    .rentType("HOURLY")
                    .roomAssignmentStatus("ASSIGNED")
                    .extensionHours((int) actualHours)
                    .extensionAmount(switchFee)
                    .status("CHECKED_IN")
                    .build();

            bookingDetailRepository.save(switchDetail);
            booking.setRoomChargeBeforeDiscount(booking.getRoomChargeBeforeDiscount().add(switchFee));
            bookingRepository.save(booking);
        } else {
            Room currentRoom = detail.getRoom();
            if (currentRoom == null) {
                throw new IllegalArgumentException("Đơn đặt phòng chưa được gán số phòng cụ thể");
            }

            if ("MAINTENANCE".equalsIgnoreCase(currentRoom.getStatus()) || inProgressRoomIds.contains(currentRoom.getId())) {
                throw new IllegalArgumentException("Phòng " + currentRoom.getRoomNumber() + " đang gặp sự cố bảo trì");
            }

            boolean hasConflict = bookingDetailRepository.findOverlappingSchedule(currentCheckOut, newCheckOut)
                    .stream()
                    .filter(this::isActive)
                    .filter(d -> !d.getId().equals(detail.getId()))
                    .anyMatch(d -> d.getRoom() != null && d.getRoom().getId().equals(currentRoom.getId()));

            if (hasConflict) {
                throw new IllegalArgumentException("Phòng " + currentRoom.getRoomNumber() + " đã có khách đặt trước trong khung giờ tiếp theo. Vui lòng chọn chuyển đổi sang phòng khác hoặc trả phòng đúng giờ.");
            }

            BigDecimal hourlyRate = calculateHourlyRate(detail.getRoomType(), detail);
            BigDecimal extensionFee = hourlyRate.multiply(BigDecimal.valueOf(actualHours));

            detail.setCheckOutTarget(newCheckOut);
            detail.setPriceAtBooking(detail.getPriceAtBooking().add(extensionFee));
            detail.setExtensionHours((detail.getExtensionHours() == null ? 0 : detail.getExtensionHours()) + (int) actualHours);
            detail.setExtensionAmount((detail.getExtensionAmount() == null ? BigDecimal.ZERO : detail.getExtensionAmount()).add(extensionFee));
            bookingDetailRepository.save(detail);

            booking.setRoomChargeBeforeDiscount(booking.getRoomChargeBeforeDiscount().add(extensionFee));
            bookingRepository.save(booking);
        }

        return getMyBookingDetail(email, bookingId);
    }

    private BigDecimal calculateBookingPaidAmount(Booking booking) {
        if (booking == null || booking.getId() == null) return BigDecimal.ZERO;
        Optional<Invoice> invoiceOpt = invoiceRepository.findByBookingId(booking.getId());
        if (invoiceOpt.isEmpty()) return BigDecimal.ZERO;
        return paymentRepository.findByInvoiceIdOrderByPaymentTimeDescIdDesc(invoiceOpt.get().getId()).stream()
                .filter(p -> "SUCCESS".equalsIgnoreCase(p.getStatus()))
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @Override
    @Transactional(readOnly = true)
    public PublicBookingCancelPolicyPreviewResponse getCancelPolicyPreview(String email, Long bookingId) {
        Booking booking = findOwnedBookingForUpdate(email, bookingId);
        if ("CANCELLED".equalsIgnoreCase(booking.getStatus()) || "COMPLETED".equalsIgnoreCase(booking.getStatus())) {
            throw new IllegalArgumentException("Không thể hủy đơn đặt phòng ở trạng thái này");
        }

        List<BookingDetail> details = bookingDetailRepository.findByBookingId(booking.getId());
        if (details.isEmpty()) {
            throw new IllegalArgumentException("Đơn đặt phòng không có thông tin chi tiết");
        }

        LocalDateTime earliestCheckIn = details.stream()
                .map(BookingDetail::getCheckInTarget)
                .filter(Objects::nonNull)
                .min(LocalDateTime::compareTo)
                .orElse(booking.getBookingDate());

        LocalDateTime now = LocalDateTime.now();
        long diffMinutes = Duration.between(now, earliestCheckIn).toMinutes();
        double diffHours = diffMinutes / 60.0;

        BigDecimal roomCharge = calculateRoomCharge(details);
        List<Long> detailIds = details.stream().map(BookingDetail::getId).toList();
        List<BookingServiceItem> serviceItems = bookingServiceItemRepository.findByBookingDetailIds(detailIds);
        List<ServiceUsage> stayUsages = serviceUsageRepository.findByBookingIdForInvoice(booking.getId());
        BigDecimal serviceCharge = calculateServiceCharge(serviceItems).add(calculateServiceUsageCharge(stayUsages));
        BigDecimal totalAmount = roomCharge.add(serviceCharge);

        BigDecimal paidAmount = calculateBookingPaidAmount(booking);

        int refundRate;
        BigDecimal refundAmount;
        String policyDescription;

        if (diffHours >= 48.0) {
            refundRate = 100;
            refundAmount = paidAmount;
            policyDescription = "Hủy trước 48 giờ nhận phòng: Quý khách được hoàn trả 100% số tiền đã thanh toán.";
        } else if (diffHours > 0.0) {
            refundRate = 50;
            refundAmount = paidAmount.multiply(BigDecimal.valueOf(0.5)).setScale(2, RoundingMode.HALF_UP);
            policyDescription = "Hủy trong vòng 48 giờ trước nhận phòng: Quý khách được hoàn trả 50% số tiền đã thanh toán.";
        } else {
            refundRate = 0;
            refundAmount = BigDecimal.ZERO;
            policyDescription = "Hủy sau giờ nhận phòng: Không áp dụng hoàn tiền.";
        }

        if (paidAmount.compareTo(BigDecimal.ZERO) <= 0) {
            refundAmount = BigDecimal.ZERO;
        }

        return new PublicBookingCancelPolicyPreviewResponse(
                booking.getId(),
                booking.getBookingCode(),
                earliestCheckIn,
                now,
                Math.round(diffHours * 10.0) / 10.0,
                totalAmount,
                paidAmount,
                refundRate,
                refundAmount,
                policyDescription,
                refundAmount.compareTo(BigDecimal.ZERO) > 0
        );
    }

    @Override
    @Transactional
    public PublicBookingHistoryDetailResponse cancelMyBooking(String email, Long bookingId, PublicBookingCancelRequest request) {
        Booking booking = findOwnedBookingForUpdate(email, bookingId);
        if ("CANCELLED".equalsIgnoreCase(booking.getStatus()) || "COMPLETED".equalsIgnoreCase(booking.getStatus())) {
            throw new IllegalArgumentException("Không thể hủy đơn đặt phòng ở trạng thái này");
        }

        PublicBookingCancelPolicyPreviewResponse preview = getCancelPolicyPreview(email, bookingId);

        booking.setStatus("CANCELLED");
        booking.setCancellationReason(request.reason());
        booking.setCancelledAt(LocalDateTime.now());
        booking.setRefundRate(preview.refundRate());
        booking.setRefundAmount(preview.refundAmount());
        booking.setRefundStatus(preview.refundAmount().compareTo(BigDecimal.ZERO) > 0 ? "PENDING_REFUND" : "NO_REFUND");

        StringBuilder refundInfo = new StringBuilder();
        if (request.zaloPhone() != null && !request.zaloPhone().isBlank()) {
            refundInfo.append("SĐT/Zalo: ").append(request.zaloPhone().trim());
        }
        if (request.bankAccountNumber() != null && !request.bankAccountNumber().isBlank()) {
            if (!refundInfo.isEmpty()) refundInfo.append(" | ");
            refundInfo.append("STK: ").append(request.bankAccountNumber().trim());
            if (request.bankName() != null && !request.bankName().isBlank()) {
                refundInfo.append(" - ").append(request.bankName().trim());
            }
            if (request.accountHolderName() != null && !request.accountHolderName().isBlank()) {
                refundInfo.append(" (").append(request.accountHolderName().trim()).append(")");
            }
        }
        booking.setRefundInfo(refundInfo.toString());

        List<BookingDetail> details = bookingDetailRepository.findByBookingId(booking.getId());
        for (BookingDetail detail : details) {
            if (!"COMPLETED".equalsIgnoreCase(detail.getStatus())) {
                detail.setStatus("CANCELLED");
                bookingDetailRepository.save(detail);
            }
        }

        bookingRepository.save(booking);

        return getMyBookingDetail(email, bookingId);
    }

    private static final class RoomBookingLine {
        private final PublicBookingRoomRequest request;
        private final RoomType roomType;
        private final BigDecimal price;
        private BigDecimal allocatedDiscount = BigDecimal.ZERO;

        private RoomBookingLine(PublicBookingRoomRequest request, RoomType roomType, BigDecimal price) {
            this.request = request;
            this.roomType = roomType;
            this.price = price;
        }

        private PublicBookingRoomRequest request() {
            return request;
        }

        private RoomType roomType() {
            return roomType;
        }

        private BigDecimal price() {
            return price;
        }

        private BigDecimal allocatedDiscount() {
            return allocatedDiscount;
        }

        private void setAllocatedDiscount(BigDecimal allocatedDiscount) {
            this.allocatedDiscount = allocatedDiscount;
        }
    }

    private record VoucherDiscount(
            Voucher voucher,
            String code,
            String discountType,
            BigDecimal discountValue,
            BigDecimal amount
    ) {
        private static VoucherDiscount empty() {
            return new VoucherDiscount(null, null, null, null, BigDecimal.ZERO);
        }
    }
}

