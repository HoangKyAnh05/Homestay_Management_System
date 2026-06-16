package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.request.PublicBookingServiceRequest;
import com.homestayManagement.homestayManagement.dto.request.PublicBookingRoomRequest;
import com.homestayManagement.homestayManagement.dto.request.PublicCreateBookingRequest;
import com.homestayManagement.homestayManagement.dto.response.*;
import com.homestayManagement.homestayManagement.entity.*;
import com.homestayManagement.homestayManagement.repository.*;
import com.homestayManagement.homestayManagement.service.PublicBookingService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class PublicBookingServiceImpl implements PublicBookingService {

    private static final Set<String> ACTIVE_STATUSES = Set.of("PENDING", "CONFIRMED", "CHECKED_IN");

    private final AccountRepository accountRepository;
    private final CustomerRepository customerRepository;
    private final RoomRepository roomRepository;
    private final RoomTypeRepository roomTypeRepository;
    private final BookingRepository bookingRepository;
    private final BookingDetailRepository bookingDetailRepository;
    private final BookingGuestRepository bookingGuestRepository;
    private final BookingServiceItemRepository bookingServiceItemRepository;
    private final PricePolicyRepository pricePolicyRepository;
    private final RoomPriceConfigRepository roomPriceConfigRepository;
    private final FacilityServiceRepository facilityServiceRepository;
    private final InventoryServiceRepository inventoryServiceRepository;

    public PublicBookingServiceImpl(
            AccountRepository accountRepository,
            CustomerRepository customerRepository,
            RoomRepository roomRepository,
            RoomTypeRepository roomTypeRepository,
            BookingRepository bookingRepository,
            BookingDetailRepository bookingDetailRepository,
            BookingGuestRepository bookingGuestRepository,
            BookingServiceItemRepository bookingServiceItemRepository,
            PricePolicyRepository pricePolicyRepository,
            RoomPriceConfigRepository roomPriceConfigRepository,
            FacilityServiceRepository facilityServiceRepository,
            InventoryServiceRepository inventoryServiceRepository
    ) {
        this.accountRepository = accountRepository;
        this.customerRepository = customerRepository;
        this.roomRepository = roomRepository;
        this.roomTypeRepository = roomTypeRepository;
        this.bookingRepository = bookingRepository;
        this.bookingDetailRepository = bookingDetailRepository;
        this.bookingGuestRepository = bookingGuestRepository;
        this.bookingServiceItemRepository = bookingServiceItemRepository;
        this.pricePolicyRepository = pricePolicyRepository;
        this.roomPriceConfigRepository = roomPriceConfigRepository;
        this.facilityServiceRepository = facilityServiceRepository;
        this.inventoryServiceRepository = inventoryServiceRepository;
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
                .map(service -> new PublicServiceOptionResponse(service.getId(), service.getName(), service.getPrice(), "FACILITY", null))
                .toList();
        List<PublicServiceOptionResponse> inventories = inventoryServiceRepository.findAll().stream()
                .filter(service -> service.getQuantityInStock() == null || service.getQuantityInStock() > 0)
                .map(service -> new PublicServiceOptionResponse(service.getId(), service.getName(), service.getPrice(), "INVENTORY", service.getQuantityInStock()))
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
        Booking booking = details.get(0).getBooking();
        BigDecimal roomCharge = calculateRoomCharge(details);
        List<Long> detailIds = details.stream().map(BookingDetail::getId).toList();
        List<BookingServiceItem> serviceItems = bookingServiceItemRepository.findByBookingDetailIds(detailIds);
        BigDecimal serviceCharge = calculateServiceCharge(serviceItems);
        BigDecimal totalAmount = roomCharge.add(serviceCharge);
        DepositPolicy depositPolicy = booking.getDepositPolicy();

        return new PublicBookingHistoryDetailResponse(
                booking.getId(),
                booking.getBookingDate(),
                booking.getStatus(),
                roomCharge,
                serviceCharge,
                totalAmount,
                requiresPayment(booking),
                depositPolicy != null ? depositPolicy.getPolicyName() : null,
                depositPolicy != null ? depositPolicy.getCalculationType() : null,
                depositPolicy != null ? depositPolicy.getPolicyValue() : null,
                calculateDepositAmount(depositPolicy, totalAmount),
                details.stream().map(this::toHistoryRoomResponse).toList(),
                serviceItems.stream().map(this::toHistoryServiceResponse).toList()
        );
    }

    @Override
    @Transactional
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
        Set<Long> selectedRoomTypeIds = selectedRooms.stream()
                .map(this::resolveRoomTypeId)
                .collect(Collectors.toCollection(HashSet::new));
        Map<Long, RoomType> roomTypesById = roomTypeRepository.findAllById(selectedRoomTypeIds).stream()
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
        DepositPolicy depositPolicy = selectedRooms.stream()
                .map(selectedRoom -> roomTypesById.get(resolveRoomTypeId(selectedRoom)))
                .filter(roomType -> roomType != null && roomType.getDepositPolicy() != null)
                .map(RoomType::getDepositPolicy)
                .findFirst()
                .orElse(null);
        boolean hourlyPrepaymentRequired = isHourlyPolicy(pricePolicy);
        boolean requiresDeposit = hourlyPrepaymentRequired || depositPolicy != null;
        String bookingStatus = requiresDeposit ? "PENDING" : "CONFIRMED";

        Booking booking = bookingRepository.save(Booking.builder()
                .customer(customer)
                .depositPolicy(depositPolicy)
                .bookingDate(LocalDateTime.now())
                .status(bookingStatus)
                .build());

        List<BookingDetail> savedDetails = new ArrayList<>();
        for (PublicBookingRoomRequest selectedRoom : selectedRooms) {
            RoomType roomType = roomTypesById.get(resolveRoomTypeId(selectedRoom));
            BigDecimal currentRoomPrice = roomPriceConfigRepository
                    .findByRoomTypeIdAndPricePolicyIdAndDayType(roomType.getId(), pricePolicy.getId(), dayType)
                    .map(RoomPriceConfig::getPrice)
                    .orElseThrow(() -> new IllegalArgumentException("Chua cau hinh gia cho loai phong " + roomType.getName() + " va goi thue nay"));
            for (int index = 0; index < quantityOf(selectedRoom); index++) {
                savedDetails.add(bookingDetailRepository.save(BookingDetail.builder()
                        .booking(booking)
                        .roomType(roomType)
                        .room(null)
                        .checkInTarget(request.checkInTarget())
                        .checkOutTarget(request.checkOutTarget())
                        .numberOfAdults(selectedRoom.numberOfAdults())
                        .numberOfChildren(selectedRoom.numberOfChildren())
                        .priceAtBooking(currentRoomPrice)
                        .rentType(pricePolicy.getRentType())
                        .roomAssignmentStatus("UNASSIGNED")
                        .status(bookingStatus)
                        .build()));
            }
        }

        BookingDetail firstDetail = savedDetails.get(0);
        BigDecimal roomCharge = calculateRoomCharge(savedDetails);
        BigDecimal serviceCharge = saveServices(firstDetail, request.services());
        BigDecimal totalAmount = roomCharge.add(serviceCharge);
        BigDecimal depositAmount = hourlyPrepaymentRequired
                ? roomCharge
                : requiresDeposit ? calculateDepositAmount(depositPolicy, totalAmount) : BigDecimal.ZERO;
        savePrimaryBookingGuest(booking, firstDetail, customer, request.identityDocumentNumber());

        return new PublicBookingResponse(
                booking.getId(),
                firstDetail.getId(),
                null,
                null,
                booking.getStatus(),
                firstDetail.getCheckInTarget(),
                firstDetail.getCheckOutTarget(),
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
                    request.numberOfChildren()
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
                    request.numberOfChildren()
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

    private void validatePolicyTime(PricePolicy policy, LocalDateTime checkInTarget, LocalDateTime checkOutTarget) {
        String rentType = normalize(policy.getRentType());
        if (Set.of("OVERNIGHT", "NIGHTLY", "BY_NIGHT").contains(rentType)) {
            LocalTime standardCheckIn = policy.getStandardCheckIn() != null ? policy.getStandardCheckIn() : LocalTime.of(19, 0);
            LocalTime standardCheckOut = policy.getStandardCheckOut() != null ? policy.getStandardCheckOut() : LocalTime.of(11, 0);
            boolean checkInTooEarly = checkInTarget.toLocalTime().isBefore(standardCheckIn);
            boolean checkOutNotNextDay = !checkOutTarget.toLocalDate().equals(checkInTarget.toLocalDate().plusDays(1));
            boolean checkOutTooLate = checkOutTarget.toLocalTime().isAfter(standardCheckOut);
            if (checkInTooEarly || checkOutNotNextDay || checkOutTooLate) {
                throw new IllegalArgumentException("Book qua Ä‘Ãªm nháº­n phÃ²ng tá»« 19h tá»‘i Ä‘áº¿n 11h sÃ¡ng hÃ´m sau");
            }
        }

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
        return ACTIVE_STATUSES.contains(normalize(detail.getStatus()))
                && ACTIVE_STATUSES.contains(normalize(detail.getBooking().getStatus()));
    }

    private PublicBookingHistoryResponse toHistoryResponse(List<BookingDetail> details) {
        Booking booking = details.get(0).getBooking();
        BookingDetail firstDetail = details.stream()
                .min(Comparator.comparing(BookingDetail::getCheckInTarget))
                .orElse(details.get(0));
        BigDecimal roomCharge = calculateRoomCharge(details);
        List<Long> detailIds = details.stream().map(BookingDetail::getId).toList();
        BigDecimal serviceCharge = calculateServiceCharge(bookingServiceItemRepository.findByBookingDetailIds(detailIds));
        BigDecimal totalAmount = roomCharge.add(serviceCharge);
        DepositPolicy depositPolicy = booking.getDepositPolicy();
        Room room = firstDetail.getRoom();
        RoomType roomType = firstDetail.getRoomType() != null ? firstDetail.getRoomType() : room != null ? room.getRoomType() : null;

        return new PublicBookingHistoryResponse(
                booking.getId(),
                booking.getBookingDate(),
                booking.getStatus(),
                room != null ? room.getRoomNumber() : null,
                roomType != null ? roomType.getName() : null,
                firstDetail.getCheckInTarget(),
                details.stream().map(BookingDetail::getCheckOutTarget).max(LocalDateTime::compareTo).orElse(firstDetail.getCheckOutTarget()),
                details.size(),
                roomCharge,
                serviceCharge,
                totalAmount,
                requiresPayment(booking),
                depositPolicy != null ? depositPolicy.getPolicyName() : null,
                depositPolicy != null ? depositPolicy.getCalculationType() : null,
                depositPolicy != null ? depositPolicy.getPolicyValue() : null,
                calculateDepositAmount(depositPolicy, totalAmount)
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
                item.getBookingDetail().getId(),
                name,
                type,
                item.getQuantity(),
                item.getPriceAtBooking(),
                total
        );
    }

    private BigDecimal calculateRoomCharge(List<BookingDetail> details) {
        return details.stream()
                .map(BookingDetail::getPriceAtBooking)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal calculateServiceCharge(List<BookingServiceItem> services) {
        return services.stream()
                .map(item -> item.getPriceAtBooking().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private boolean requiresPayment(Booking booking) {
        return booking.getDepositPolicy() != null && "PENDING".equals(normalize(booking.getStatus()));
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
}

