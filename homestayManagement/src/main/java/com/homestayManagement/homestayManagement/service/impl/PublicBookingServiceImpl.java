package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.request.PublicBookingServiceRequest;
import com.homestayManagement.homestayManagement.dto.request.PublicBookingFeedbackRequest;
import com.homestayManagement.homestayManagement.dto.request.PublicBookingRoomRequest;
import com.homestayManagement.homestayManagement.dto.request.PublicCreateBookingRequest;
import com.homestayManagement.homestayManagement.dto.response.*;
import com.homestayManagement.homestayManagement.entity.*;
import com.homestayManagement.homestayManagement.repository.*;
import com.homestayManagement.homestayManagement.service.PublicBookingService;
import com.homestayManagement.homestayManagement.service.support.BookingCodeGenerator;
import com.homestayManagement.homestayManagement.service.support.BookingInventoryPolicy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
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
            BookingCodeGenerator bookingCodeGenerator
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

        return new PublicBookingHistoryDetailResponse(
                booking.getId(),
                booking.getBookingCode(),
                booking.getBookingDate(),
                booking.getStatus(),
                booking.getVoucherCode(),
                booking.getVoucherDiscountType(),
                booking.getVoucherDiscountValue(),
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
                ).toList()
        );
    }

    private Booking findOwnedBookingForUpdate(String email, Long bookingId) {
        return bookingRepository.findByIdAndCustomerEmailForPublicUpdate(bookingId, email)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn đặt phòng"));
    }

    @Override
    @Transactional(isolation = Isolation.SERIALIZABLE)
    public PublicBookingResponse createBooking(String email, PublicCreateBookingRequest request) {
        validateRange(request.checkInTarget(), request.checkOutTarget());

        Account account = accountRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay tai khoan"));
        if (account.getRole() == null || !"ROLE_CUSTOMER".equals(account.getRole().getName())) {
            throw new IllegalArgumentException("Chi tai khoan khach hang moi co the dat phong");
        }

        Customer customer = customerRepository.findByAccountId(account.getId())
                .orElseGet(() -> Customer.builder().account(account).fullName(request.fullName().trim()).build());
        updateCustomer(customer, request);

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

        PricePolicy pricePolicy = pricePolicyRepository.findById(request.pricePolicyId())
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay goi thue"));
        validatePolicyTime(pricePolicy, request.checkInTarget(), request.checkOutTarget());
        String dayType = isWeekend(request.checkInTarget()) ? "WEEKEND" : "WEEKDAY";
        List<RoomBookingLine> roomLines = buildRoomBookingLines(selectedRooms, roomTypesById, pricePolicy, dayType);
        BigDecimal roomChargeBeforeDiscount = roomLines.stream()
                .map(RoomBookingLine::price)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        VoucherDiscount voucherDiscount = resolveVoucherDiscount(request.voucherCode(), roomChargeBeforeDiscount);
        applyAllocatedDiscounts(roomLines, voucherDiscount.amount());
        DepositPolicy depositPolicy = selectedRooms.stream()
                .map(selectedRoom -> roomTypesById.get(resolveRoomTypeId(selectedRoom)))
                .filter(roomType -> roomType != null && roomType.getDepositPolicy() != null)
                .map(RoomType::getDepositPolicy)
                .findFirst()
                .orElse(null);
        boolean hourlyPrepaymentRequired = isHourlyPolicy(pricePolicy);
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
                .roomDiscountAmount(voucherDiscount.amount())
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
                depositAmount
        );
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

        for (Map.Entry<Long, Integer> entry : requestedCountByType.entrySet()) {
            Long roomTypeId = entry.getKey();
            int requestedQuantity = entry.getValue();
            int totalRooms = roomRepository.findByRoomTypeId(roomTypeId).size();
            long bookedRooms = bookedCountByType.getOrDefault(roomTypeId, 0L);
            int availableRooms = Math.max(0, (int) (totalRooms - bookedRooms));
            if (availableRooms < requestedQuantity) {
                RoomType roomType = roomTypesById.get(roomTypeId);
                throw new IllegalArgumentException("Loai phong " + roomType.getName() + " chi con " + availableRooms + " phong trong khoang thoi gian nay");
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
            throw new IllegalArgumentException("Vui lÃƒÂ²ng chÃ¡Â»Ân giÃ¡Â»Â nhÃ¡ÂºÂ­n vÃƒÂ  trÃ¡ÂºÂ£ phÃƒÂ²ng");
        }
        if (!checkOutTarget.isAfter(checkInTarget)) {
            throw new IllegalArgumentException("GiÃ¡Â»Â trÃ¡ÂºÂ£ phÃƒÂ²ng phÃ¡ÂºÂ£i sau giÃ¡Â»Â nhÃ¡ÂºÂ­n phÃƒÂ²ng");
        }
    }

    void validatePolicyTime(PricePolicy policy, LocalDateTime checkInTarget, LocalDateTime checkOutTarget) {
        String rentType = normalize(policy.getRentType());
        if (Set.of("HOURLY", "BY_HOUR", "COMBO").contains(rentType)) {
            int limitHours = policy.getLimitHours() != null && policy.getLimitHours() > 0 ? policy.getLimitHours() : 1;
            LocalDateTime expectedCheckOut = checkInTarget.plusHours(limitHours);
            if (!checkOutTarget.equals(expectedCheckOut)) {
                throw new IllegalArgumentException("GÃ³i theo giá»/combo chá»‰ cáº§n chá»n giá» nháº­n phÃ²ng, giá» tráº£ phÃ²ng sáº½ Ä‘Æ°á»£c há»‡ thá»‘ng tá»± tÃ­nh");
            }
        }
    }

    private boolean isHourlyPolicy(PricePolicy policy) {
        String rentType = normalize(policy.getRentType());
        return Set.of("HOURLY", "BY_HOUR").contains(rentType);
    }

    private void updateCustomer(Customer customer, PublicCreateBookingRequest request) {
        customer.setFullName(request.fullName().trim());
        customer.setPhone(request.phone().trim());
        customer.setAddress(request.address() != null && !request.address().isBlank() ? request.address().trim() : null);
        customer.setDateOfBirth(request.dateOfBirth());
        customerRepository.save(customer);
    }

    private void validateCapacity(RoomType roomType, Integer adults, Integer children) {
        if (roomType == null) {
            throw new IllegalArgumentException("PhÃƒÂ²ng chÃ†Â°a cÃƒÂ³ loÃ¡ÂºÂ¡i phÃƒÂ²ng");
        }
        if (adults > roomType.getMaxAdults() || children > roomType.getMaxChildren()) {
            throw new IllegalArgumentException("SÃ¡Â»â€˜ khÃƒÂ¡ch vÃ†Â°Ã¡Â»Â£t quÃƒÂ¡ sÃ¡Â»Â©c chÃ¡Â»Â©a cÃ¡Â»Â§a phÃƒÂ²ng");
        }
    }

    private void ensureRoomAvailable(Room room, LocalDateTime checkInTarget, LocalDateTime checkOutTarget) {
        boolean busy = bookingDetailRepository.findOverlappingSchedule(checkInTarget, checkOutTarget).stream()
                .filter(detail -> detail.getRoom() != null && room.getId().equals(detail.getRoom().getId()))
                .anyMatch(this::isActive);
        if (busy) {
            throw new IllegalArgumentException("PhÃƒÂ²ng Ã„â€˜ÃƒÂ£ cÃƒÂ³ booking trong khung giÃ¡Â»Â nÃƒÂ y");
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
                booking.getCustomerFeedbackAt()
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
                detail.getStatus()
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
            PricePolicy pricePolicy,
            String dayType
    ) {
        List<RoomBookingLine> lines = new ArrayList<>();
        for (PublicBookingRoomRequest selectedRoom : selectedRooms) {
            RoomType roomType = roomTypesById.get(resolveRoomTypeId(selectedRoom));
            BigDecimal currentRoomPrice = roomPriceConfigRepository
                    .findByRoomTypeIdAndPricePolicyIdAndDayType(roomType.getId(), pricePolicy.getId(), dayType)
                    .map(RoomPriceConfig::getPrice)
                    .orElseThrow(() -> new IllegalArgumentException("Chua cau hinh gia cho loai phong " + roomType.getName() + " va goi thue nay"));
            for (int index = 0; index < quantityOf(selectedRoom); index++) {
                lines.add(new RoomBookingLine(selectedRoom, roomType, currentRoomPrice));
            }
        }
        return lines;
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

