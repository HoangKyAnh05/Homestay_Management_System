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
    private final BookingRepository bookingRepository;
    private final BookingDetailRepository bookingDetailRepository;
    private final BookingServiceItemRepository bookingServiceItemRepository;
    private final PricePolicyRepository pricePolicyRepository;
    private final RoomPriceConfigRepository roomPriceConfigRepository;
    private final FacilityServiceRepository facilityServiceRepository;
    private final InventoryServiceRepository inventoryServiceRepository;

    public PublicBookingServiceImpl(
            AccountRepository accountRepository,
            CustomerRepository customerRepository,
            RoomRepository roomRepository,
            BookingRepository bookingRepository,
            BookingDetailRepository bookingDetailRepository,
            BookingServiceItemRepository bookingServiceItemRepository,
            PricePolicyRepository pricePolicyRepository,
            RoomPriceConfigRepository roomPriceConfigRepository,
            FacilityServiceRepository facilityServiceRepository,
            InventoryServiceRepository inventoryServiceRepository
    ) {
        this.accountRepository = accountRepository;
        this.customerRepository = customerRepository;
        this.roomRepository = roomRepository;
        this.bookingRepository = bookingRepository;
        this.bookingDetailRepository = bookingDetailRepository;
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
            throw new IllegalArgumentException("KhÃ´ng tÃ¬m tháº¥y Ä‘Æ¡n Ä‘áº·t phÃ²ng");
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
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài khoản"));
        if (account.getRole() == null || !"ROLE_CUSTOMER".equals(account.getRole().getName())) {
            throw new IllegalArgumentException("Chỉ tài khoản khách hàng mới có thể đặt phòng");
        }

        Customer customer = customerRepository.findByAccountId(account.getId())
                .orElseGet(() -> Customer.builder().account(account).fullName(request.fullName().trim()).build());
        updateCustomer(customer, request);

        List<PublicBookingRoomRequest> selectedRooms = requireSelectedRooms(request);
        Set<Long> selectedRoomIds = selectedRooms.stream()
                .map(PublicBookingRoomRequest::roomId)
                .collect(Collectors.toCollection(HashSet::new));
        if (selectedRoomIds.size() != selectedRooms.size()) {
            throw new IllegalArgumentException("Danh sách phòng bị trùng");
        }

        Map<Long, Room> roomsById = roomRepository.findAllById(selectedRoomIds).stream()
                .collect(Collectors.toMap(Room::getId, currentRoom -> currentRoom));
        if (roomsById.size() != selectedRoomIds.size()) {
            throw new IllegalArgumentException("Không tìm thấy một hoặc nhiều phòng đã chọn");
        }

        for (PublicBookingRoomRequest selectedRoom : selectedRooms) {
            Room currentRoom = roomsById.get(selectedRoom.roomId());
            validateCapacity(currentRoom.getRoomType(), selectedRoom.numberOfAdults(), selectedRoom.numberOfChildren());
        }

        Set<Long> busyRoomIds = bookingDetailRepository.findOverlappingSchedule(request.checkInTarget(), request.checkOutTarget())
                .stream()
                .filter(this::isActive)
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

        PricePolicy pricePolicy = pricePolicyRepository.findById(request.pricePolicyId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy gói thuê"));
        String dayType = isWeekend(request.checkInTarget()) ? "WEEKEND" : "WEEKDAY";
        DepositPolicy depositPolicy = selectedRooms.stream()
                .map(selectedRoom -> roomsById.get(selectedRoom.roomId()))
                .map(Room::getRoomType)
                .filter(roomType -> roomType != null && roomType.getDepositPolicy() != null)
                .map(RoomType::getDepositPolicy)
                .findFirst()
                .orElse(null);
        boolean requiresDeposit = depositPolicy != null;
        String bookingStatus = requiresDeposit ? "PENDING" : "CONFIRMED";

        Booking booking = bookingRepository.save(Booking.builder()
                .customer(customer)
                .depositPolicy(depositPolicy)
                .bookingDate(LocalDateTime.now())
                .status(bookingStatus)
                .build());

        List<BookingDetail> savedDetails = selectedRooms.stream()
                .map(selectedRoom -> {
                    Room currentRoom = roomsById.get(selectedRoom.roomId());
                    BigDecimal currentRoomPrice = roomPriceConfigRepository
                            .findByRoomTypeIdAndPricePolicyIdAndDayType(currentRoom.getRoomType().getId(), pricePolicy.getId(), dayType)
                            .map(RoomPriceConfig::getPrice)
                            .orElseThrow(() -> new IllegalArgumentException("Chưa cấu hình giá cho phòng " + currentRoom.getRoomNumber() + " và gói thuê này"));
                    return bookingDetailRepository.save(BookingDetail.builder()
                            .booking(booking)
                            .room(currentRoom)
                            .checkInTarget(request.checkInTarget())
                            .checkOutTarget(request.checkOutTarget())
                            .numberOfAdults(selectedRoom.numberOfAdults())
                            .numberOfChildren(selectedRoom.numberOfChildren())
                            .priceAtBooking(currentRoomPrice)
                            .rentType(pricePolicy.getRentType())
                            .status(bookingStatus)
                            .build());
                })
                .toList();

        BookingDetail firstDetail = savedDetails.get(0);
        Room firstRoom = firstDetail.getRoom();
        BigDecimal roomCharge = calculateRoomCharge(savedDetails);
        BigDecimal serviceCharge = saveServices(firstDetail, request.services());
        BigDecimal totalAmount = roomCharge.add(serviceCharge);
        BigDecimal depositAmount = requiresDeposit ? calculateDepositAmount(depositPolicy, totalAmount) : BigDecimal.ZERO;

        return new PublicBookingResponse(
                booking.getId(),
                firstDetail.getId(),
                firstRoom.getId(),
                firstRoom.getRoomNumber(),
                booking.getStatus(),
                firstDetail.getCheckInTarget(),
                firstDetail.getCheckOutTarget(),
                roomCharge,
                serviceCharge,
                totalAmount,
                savedDetails.stream().map(this::toPublicBookingRoomResponse).toList(),
                requiresDeposit,
                depositPolicy != null ? depositPolicy.getPolicyName() : null,
                depositPolicy != null ? depositPolicy.getCalculationType() : null,
                depositPolicy != null ? depositPolicy.getPolicyValue() : null,
                depositAmount
        );
    }
    private List<PublicBookingRoomRequest> requireSelectedRooms(PublicCreateBookingRequest request) {
        if (request.rooms() != null && !request.rooms().isEmpty()) {
            return request.rooms();
        }
        if (request.roomId() != null) {
            return List.of(new PublicBookingRoomRequest(
                    request.roomId(),
                    request.numberOfAdults(),
                    request.numberOfChildren()
            ));
        }
        throw new IllegalArgumentException("Vui lòng chọn ít nhất một phòng");
    }

    private PublicBookingRoomResponse toPublicBookingRoomResponse(BookingDetail detail) {
        Room room = detail.getRoom();
        RoomType roomType = room.getRoomType();
        return new PublicBookingRoomResponse(
                detail.getId(),
                room.getId(),
                room.getRoomNumber(),
                roomType != null ? roomType.getName() : null,
                detail.getNumberOfAdults(),
                detail.getNumberOfChildren(),
                detail.getPriceAtBooking(),
                detail.getRentType()
        );
    }

    private void validateRange(LocalDateTime checkInTarget, LocalDateTime checkOutTarget) {
        if (checkInTarget == null || checkOutTarget == null) {
            throw new IllegalArgumentException("Vui lÃ²ng chá»n giá» nháº­n vÃ  tráº£ phÃ²ng");
        }
        if (!checkOutTarget.isAfter(checkInTarget)) {
            throw new IllegalArgumentException("Giá» tráº£ phÃ²ng pháº£i sau giá» nháº­n phÃ²ng");
        }
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
            throw new IllegalArgumentException("PhÃ²ng chÆ°a cÃ³ loáº¡i phÃ²ng");
        }
        if (adults > roomType.getMaxAdults() || children > roomType.getMaxChildren()) {
            throw new IllegalArgumentException("Sá»‘ khÃ¡ch vÆ°á»£t quÃ¡ sá»©c chá»©a cá»§a phÃ²ng");
        }
    }

    private void ensureRoomAvailable(Room room, LocalDateTime checkInTarget, LocalDateTime checkOutTarget) {
        boolean busy = bookingDetailRepository.findOverlappingSchedule(checkInTarget, checkOutTarget).stream()
                .filter(detail -> room.getId().equals(detail.getRoom().getId()))
                .anyMatch(this::isActive);
        if (busy) {
            throw new IllegalArgumentException("PhÃ²ng Ä‘Ã£ cÃ³ booking trong khung giá» nÃ y");
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

        return new PublicBookingHistoryResponse(
                booking.getId(),
                booking.getBookingDate(),
                booking.getStatus(),
                firstDetail.getRoom().getRoomNumber(),
                firstDetail.getRoom().getRoomType() != null ? firstDetail.getRoom().getRoomType().getName() : null,
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
        RoomType roomType = room.getRoomType();
        return new PublicBookingHistoryRoomResponse(
                detail.getId(),
                room.getId(),
                room.getRoomNumber(),
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
                        .orElseThrow(() -> new IllegalArgumentException("Dá»‹ch vá»¥ khÃ´ng há»£p lá»‡"));
                bookingServiceItemRepository.save(BookingServiceItem.builder()
                        .bookingDetail(detail)
                        .facilityService(service)
                        .quantity(quantity)
                        .priceAtBooking(service.getPrice())
                        .build());
                total = total.add(service.getPrice().multiply(BigDecimal.valueOf(quantity)));
            } else if ("INVENTORY".equals(type)) {
                InventoryService service = inventoryServiceRepository.findById(request.serviceId())
                        .orElseThrow(() -> new IllegalArgumentException("Dá»‹ch vá»¥ thuÃª Ä‘á»“ khÃ´ng há»£p lá»‡"));
                if (service.getQuantityInStock() != null && quantity > service.getQuantityInStock()) {
                    throw new IllegalArgumentException("Sá»‘ lÆ°á»£ng dá»‹ch vá»¥ vÆ°á»£t tá»“n kho");
                }
                bookingServiceItemRepository.save(BookingServiceItem.builder()
                        .bookingDetail(detail)
                        .inventoryService(service)
                        .quantity(quantity)
                        .priceAtBooking(service.getPrice())
                        .build());
                total = total.add(service.getPrice().multiply(BigDecimal.valueOf(quantity)));
            } else {
                throw new IllegalArgumentException("Loáº¡i dá»‹ch vá»¥ khÃ´ng há»£p lá»‡");
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

