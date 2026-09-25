package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.response.RoomBusySlotResponse;
import com.homestayManagement.homestayManagement.dto.response.RoomDetailPublicResponse;
import com.homestayManagement.homestayManagement.dto.response.RoomPublicPriceResponse;
import com.homestayManagement.homestayManagement.dto.response.RoomPublicResponse;
import com.homestayManagement.homestayManagement.dto.response.RoomSearchResponse;
import com.homestayManagement.homestayManagement.dto.response.RoomTypeResponse;
import com.homestayManagement.homestayManagement.entity.BookingDetail;
import com.homestayManagement.homestayManagement.entity.DepositPolicy;
import com.homestayManagement.homestayManagement.entity.PricePolicy;
import com.homestayManagement.homestayManagement.entity.Room;
import com.homestayManagement.homestayManagement.entity.RoomImage;
import com.homestayManagement.homestayManagement.entity.RoomPriceConfig;
import com.homestayManagement.homestayManagement.entity.RoomType;
import com.homestayManagement.homestayManagement.repository.BookingDetailRepository;
import com.homestayManagement.homestayManagement.repository.RoomImageRepository;
import com.homestayManagement.homestayManagement.repository.RoomPriceConfigRepository;
import com.homestayManagement.homestayManagement.repository.RoomRepository;
import com.homestayManagement.homestayManagement.repository.RoomTypeRepository;
import com.homestayManagement.homestayManagement.service.RoomService;
import com.homestayManagement.homestayManagement.service.support.BookingInventoryPolicy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.Map;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class RoomServiceImpl implements RoomService {

    private static final Set<String> OVERNIGHT_RENT_TYPES = Set.of("OVERNIGHT", "BY_NIGHT", "NIGHTLY");
    private static final Set<String> PREFERRED_RENT_TYPES = Set.of("OVERNIGHT", "DAILY", "BY_NIGHT", "NIGHTLY", "BY_DAY");
    private static final Set<String> DAILY_RENT_TYPES = Set.of("DAILY", "BY_DAY");

    private final RoomTypeRepository roomTypeRepository;
    private final RoomRepository roomRepository;
    private final RoomImageRepository roomImageRepository;
    private final BookingDetailRepository bookingDetailRepository;
    private final RoomPriceConfigRepository roomPriceConfigRepository;
    private final com.homestayManagement.homestayManagement.repository.RoomIncidentRepository roomIncidentRepository;

    public RoomServiceImpl(
            RoomTypeRepository roomTypeRepository,
            RoomRepository roomRepository,
            RoomImageRepository roomImageRepository,
            BookingDetailRepository bookingDetailRepository,
            RoomPriceConfigRepository roomPriceConfigRepository,
            com.homestayManagement.homestayManagement.repository.RoomIncidentRepository roomIncidentRepository
    ) {
        this.roomTypeRepository = roomTypeRepository;
        this.roomRepository = roomRepository;
        this.roomImageRepository = roomImageRepository;
        this.bookingDetailRepository = bookingDetailRepository;
        this.roomPriceConfigRepository = roomPriceConfigRepository;
        this.roomIncidentRepository = roomIncidentRepository;
    }

    private boolean isRoomAvailable(Room room) {
        if (room == null) return false;
        return !"MAINTENANCE".equalsIgnoreCase(room.getStatus());
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoomTypeResponse> getAllRoomTypes() {
        return roomTypeRepository.findAll().stream()
                .map(this::toRoomTypeResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoomPublicResponse> getAllPublicRooms() {
        return roomRepository.findAllWithRoomType().stream()
                .filter(this::isRoomAvailable)
                .map(this::toPublicRoomResponse)
                .sorted(Comparator.comparing(RoomPublicResponse::roomNumber, Comparator.nullsLast(String::compareToIgnoreCase)))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public RoomDetailPublicResponse getPublicRoomDetail(Long roomId, LocalDate fromDate, LocalDate toDate) {
        LocalDate startDate = fromDate != null ? fromDate : LocalDate.now();
        LocalDate endDate = toDate != null ? toDate : startDate.plusDays(14);
        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("Ngày kết thúc phải sau hoặc bằng ngày bắt đầu");
        }

        Room room = roomRepository.findById(roomId).orElse(null);
        RoomType roomType;
        List<Room> allTypeRooms;
        if (room != null) {
            roomType = room.getRoomType();
            allTypeRooms = roomRepository.findByRoomTypeId(roomType.getId());
        } else {
            roomType = roomTypeRepository.findById(roomId)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phòng"));
            allTypeRooms = roomRepository.findByRoomTypeId(roomType.getId());
            room = allTypeRooms.stream()
                    .filter(this::isRoomAvailable)
                    .findFirst()
                    .orElse(allTypeRooms.isEmpty() ? null : allTypeRooms.get(0));
        }

        List<Room> activeTypeRooms = allTypeRooms.stream()
                .filter(this::isRoomAvailable)
                .toList();

        if (!activeTypeRooms.isEmpty() && (room == null || !isRoomAvailable(room))) {
            room = activeTypeRooms.get(0);
        }

        boolean allInMaintenance = !allTypeRooms.isEmpty() && activeTypeRooms.isEmpty();
        String status = allInMaintenance ? "MAINTENANCE" : (activeTypeRooms.isEmpty() ? "OCCUPIED" : "AVAILABLE");

        Long effectiveRoomId = room != null ? room.getId() : null;
        DepositPolicy depositPolicy = roomType.getDepositPolicy();
        List<String> imageUrls = effectiveRoomId != null ? buildRoomImageUrls(effectiveRoomId) : List.of();
        List<RoomPublicPriceResponse> prices = roomPriceConfigRepository.findByRoomTypeIdWithPolicy(roomType.getId()).stream()
                .sorted(Comparator.comparing((RoomPriceConfig config) -> normalize(config.getPricePolicy().getRentType()))
                        .thenComparing(config -> normalize(config.getDayType()))
                        .thenComparing(RoomPriceConfig::getPrice))
                .map(this::toRoomPriceResponse)
                .toList();

        List<BookingDetail> rawBusyDetails = bookingDetailRepository.findPublicBusySlots(
                        null,
                        roomType.getId(),
                        startDate.atStartOfDay(),
                        endDate.plusDays(1).atStartOfDay()
                ).stream()
                .filter(BookingInventoryPolicy::blocksInventory)
                .toList();

        List<RoomBusySlotResponse> busySlots;
        if (allInMaintenance) {
            // ONLY when ALL physical rooms of this room type are set to MAINTENANCE
            busySlots = List.of(new RoomBusySlotResponse(
                    -1L,
                    startDate.atStartOfDay(),
                    endDate.plusDays(30).atStartOfDay(),
                    "MAINTENANCE"
            ));
        } else if (activeTypeRooms.size() <= 1) {
            busySlots = rawBusyDetails.stream()
                    .map(detail -> new RoomBusySlotResponse(
                            detail.getId(),
                            detail.getCheckInTarget(),
                            detail.getCheckOutTarget(),
                            normalizeDetailStatus(detail.getStatus())
                    ))
                    .toList();
        } else {
            int capacity = activeTypeRooms.size();
            List<RoomBusySlotResponse> fullSlots = new java.util.ArrayList<>();
            for (LocalDate d = startDate; !d.isAfter(endDate); d = d.plusDays(1)) {
                LocalDateTime dayStart = d.atTime(14, 0);
                LocalDateTime dayEnd = d.plusDays(1).atTime(12, 0);
                long overlapCount = rawBusyDetails.stream()
                        .filter(detail -> detail.getCheckInTarget().isBefore(dayEnd) && detail.getCheckOutTarget().isAfter(dayStart))
                        .count();
                if (overlapCount >= capacity) {
                    fullSlots.add(new RoomBusySlotResponse(
                            -d.toEpochDay(),
                            dayStart,
                            dayEnd,
                            "CONFIRMED"
                    ));
                }
            }
            busySlots = fullSlots;
        }

        return new RoomDetailPublicResponse(
                room != null ? room.getId() : (effectiveRoomId != null ? effectiveRoomId : 0L),
                room != null ? room.getRoomNumber() : "",
                roomType.getId(),
                roomType.getName(),
                roomType.getMaxAdults(),
                roomType.getMaxChildren(),
                roomType.getDescription(),
                status,
                depositPolicy != null ? depositPolicy.getId() : null,
                depositPolicy != null ? depositPolicy.getPolicyName() : null,
                depositPolicy != null ? depositPolicy.getCalculationType() : null,
                depositPolicy != null ? depositPolicy.getPolicyValue() : null,
                depositPolicy != null ? depositPolicy.getDescription() : null,
                imageUrls.isEmpty() ? null : imageUrls.get(0),
                imageUrls,
                prices,
                busySlots,
                roomType.getVideoUrl(),
                roomType.getAverageRating() != null ? roomType.getAverageRating() : 5.0,
                roomType.getTotalReviews() != null ? roomType.getTotalReviews() : 0
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoomSearchResponse> searchAvailableRooms(
            LocalDate checkInDate,
            LocalDate checkOutDate,
            Integer rooms,
            Integer adults,
            Integer children,
            BigDecimal maxPrice
    ) {
        validateSearch(checkInDate, checkOutDate, rooms, adults, children);
        Map<Long, Long> bookedCountByType = countBookedRoomsByRoomType(checkInDate, checkOutDate);

        int requestedRooms = rooms != null ? rooms : 1;
        int adultsPerRoom = (int) Math.ceil((adults != null ? adults : 1) / (double) requestedRooms);
        int childrenPerRoom = (int) Math.ceil((children != null ? children : 0) / (double) requestedRooms);
        String dayType = isWeekend(checkInDate) ? "WEEKEND" : "WEEKDAY";
        Map<Long, Long> totalRoomsByType = roomRepository.findAllWithRoomType().stream()
                .filter(room -> room.getRoomType() != null && isRoomAvailable(room))
                .collect(Collectors.groupingBy(room -> room.getRoomType().getId(), Collectors.counting()));

        return roomTypeRepository.findAll().stream()
                .filter(roomType -> hasCapacity(roomType, adultsPerRoom, childrenPerRoom))
                .map(roomType -> {
                    long totalRooms = totalRoomsByType.getOrDefault(roomType.getId(), 0L);
                    long bookedRooms = bookedCountByType.getOrDefault(roomType.getId(), 0L);
                    int availableRooms = Math.max(0, (int) (totalRooms - bookedRooms));
                    return toSearchResponse(roomType, dayType, availableRooms, requestedRooms);
                })
                .flatMap(Optional::stream)
                .filter(room -> maxPrice == null || room.price().compareTo(maxPrice) <= 0)
                .sorted(Comparator.comparing(RoomSearchResponse::price)
                        .thenComparing(RoomSearchResponse::roomTypeName, Comparator.nullsLast(String::compareToIgnoreCase)))
                .toList();
    }

    private Map<Long, Long> countBookedRoomsByRoomType(LocalDate checkInDate, LocalDate checkOutDate) {
        LocalDateTime startInclusive = checkInDate.atStartOfDay();
        LocalDateTime endExclusive = checkOutDate.atStartOfDay();
        return bookingDetailRepository.findOverlappingSchedule(startInclusive, endExclusive)
                .stream()
                .filter(this::isActiveBooking)
                .filter(detail -> detail.getRoomType() != null)
                .collect(Collectors.groupingBy(detail -> detail.getRoomType().getId(), Collectors.counting()));
    }

    private void validateSearch(LocalDate checkInDate, LocalDate checkOutDate, Integer rooms, Integer adults, Integer children) {
        if (checkInDate == null || checkOutDate == null) {
            throw new IllegalArgumentException("Vui lòng chọn ngày đến và ngày đi");
        }
        if (!checkOutDate.isAfter(checkInDate)) {
            throw new IllegalArgumentException("Ngày đi phải sau ngày đến");
        }
        if (rooms != null && rooms < 1) {
            throw new IllegalArgumentException("Số phòng phải lớn hơn 0");
        }
        if (adults != null && adults < 1) {
            throw new IllegalArgumentException("Số người lớn phải lớn hơn 0");
        }
        if (children != null && children < 0) {
            throw new IllegalArgumentException("Số trẻ em không hợp lệ");
        }
    }

    private boolean isActiveBooking(BookingDetail detail) {
        return BookingInventoryPolicy.blocksInventory(detail);
    }

    private boolean hasCapacity(RoomType roomType, int adultsPerRoom, int childrenPerRoom) {
        if (roomType == null) {
            return false;
        }
        int maxAdults = roomType.getMaxAdults() != null ? roomType.getMaxAdults() : 0;
        int maxChildren = roomType.getMaxChildren() != null ? roomType.getMaxChildren() : 0;
        if (adultsPerRoom > maxAdults) {
            return false;
        }
        int remainingAdultCap = maxAdults - adultsPerRoom;
        return (maxChildren >= childrenPerRoom) || (maxChildren + remainingAdultCap >= childrenPerRoom);
    }

    private Optional<RoomSearchResponse> toSearchResponse(RoomType roomType, String dayType, int availableRooms, int requestedRooms) {
        if (availableRooms < requestedRooms) {
            return Optional.empty();
        }
        List<RoomPriceConfig> configs = roomPriceConfigRepository.findByRoomTypeIdWithPolicy(roomType.getId()).stream()
                .filter(config -> dayType.equalsIgnoreCase(config.getDayType()))
                .toList();
        Optional<RoomPriceConfig> priceConfig = configs.stream()
                .filter(config -> PREFERRED_RENT_TYPES.contains(normalize(config.getPricePolicy().getRentType())))
                .min(Comparator.comparing(RoomPriceConfig::getPrice))
                .or(() -> configs.stream().min(Comparator.comparing(RoomPriceConfig::getPrice)));
        if (priceConfig.isEmpty()) {
            return Optional.empty();
        }

        List<String> imageUrls = buildRoomTypeImageUrls(roomType.getId());
        String primaryImageUrl = imageUrls.isEmpty() ? null : imageUrls.get(0);
        List<RoomPublicPriceResponse> prices = buildPublicPrices(roomType.getId());

        List<Room> physicalRooms = roomRepository.findByRoomTypeId(roomType.getId());
        boolean allInMaintenance = !physicalRooms.isEmpty() && physicalRooms.stream().noneMatch(this::isRoomAvailable);
        String status = allInMaintenance ? "MAINTENANCE" : (availableRooms > 0 ? "AVAILABLE" : "OCCUPIED");

        return Optional.of(new RoomSearchResponse(
                null,
                null,
                roomType.getId(),
                roomType.getName(),
                roomType.getMaxAdults(),
                roomType.getMaxChildren(),
                roomType.getDescription(),
                priceConfig.get().getPrice(),
                priceConfig.get().getPricePolicy().getRentType(),
                availableRooms,
                status,
                primaryImageUrl,
                imageUrls,
                prices,
                roomType.getVideoUrl(),
                roomType.getAverageRating() != null ? roomType.getAverageRating() : 5.0,
                roomType.getTotalReviews() != null ? roomType.getTotalReviews() : 0
        ));
    }

    private RoomPublicResponse toPublicRoomResponse(Room room) {
        RoomType roomType = room.getRoomType();
        DepositPolicy depositPolicy = roomType.getDepositPolicy();
        List<String> imageUrls = buildRoomImageUrls(room.getId());
        List<RoomPublicPriceResponse> prices = buildPublicPrices(roomType.getId());

        return new RoomPublicResponse(
                room.getId(),
                room.getRoomNumber(),
                roomType.getId(),
                roomType.getName(),
                roomType.getMaxAdults(),
                roomType.getMaxChildren(),
                roomType.getDescription(),
                room.getStatus(),
                findDisplayPrice(roomType.getId(), "WEEKDAY"),
                findDisplayPrice(roomType.getId(), "WEEKEND"),
                findDisplayRentType(roomType.getId()),
                depositPolicy != null ? depositPolicy.getId() : null,
                depositPolicy != null ? depositPolicy.getPolicyName() : null,
                depositPolicy != null ? depositPolicy.getCalculationType() : null,
                depositPolicy != null ? depositPolicy.getPolicyValue() : null,
                depositPolicy != null ? depositPolicy.getDescription() : null,
                imageUrls.isEmpty() ? null : imageUrls.get(0),
                imageUrls,
                prices,
                roomType.getVideoUrl(),
                roomType.getAverageRating() != null ? roomType.getAverageRating() : 5.0,
                roomType.getTotalReviews() != null ? roomType.getTotalReviews() : 0
        );
    }

    private List<RoomPublicPriceResponse> buildPublicPrices(Long roomTypeId) {
        return roomPriceConfigRepository.findByRoomTypeIdWithPolicy(roomTypeId).stream()
                // Chỉ giữ lại giá OVERNIGHT/DAILY (2 ngày 1 đêm), bỏ HOURLY/COMBO
                .filter(config -> PREFERRED_RENT_TYPES.contains(normalize(config.getPricePolicy().getRentType())))
                .sorted(Comparator.comparing((RoomPriceConfig config) -> normalize(config.getDayType()))
                        .thenComparing(RoomPriceConfig::getPrice))
                .map(this::toRoomPriceResponse)
                .toList();
    }

    private List<String> buildRoomImageUrls(Long roomId) {
        return roomImageRepository.findByRoomId(roomId).stream()
                .sorted(Comparator.comparing(RoomImage::isPrimary).reversed().thenComparing(Comparator.comparing(RoomImage::getId).reversed()))
                .map(RoomImage::getImageUrl)
                .toList();
    }

    private List<String> buildRoomTypeImageUrls(Long roomTypeId) {
        return roomRepository.findByRoomTypeId(roomTypeId).stream()
                .flatMap(room -> roomImageRepository.findByRoomId(room.getId()).stream())
                .sorted(Comparator.comparing(RoomImage::isPrimary).reversed().thenComparing(Comparator.comparing(RoomImage::getId).reversed()))
                .map(RoomImage::getImageUrl)
                .toList();
    }

    private RoomPublicPriceResponse toRoomPriceResponse(RoomPriceConfig config) {
        PricePolicy policy = config.getPricePolicy();
        return new RoomPublicPriceResponse(
                policy.getPolicyName(),
                policy.getRentType(),
                config.getDayType(),
                config.getPrice()
        );
    }

    private RoomTypeResponse toRoomTypeResponse(RoomType roomType) {
        List<Room> rooms = roomRepository.findByRoomTypeId(roomType.getId());
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime tomorrow = now.plusDays(1);
        long bookedCount = bookingDetailRepository.findOverlappingSchedule(now, tomorrow).stream()
                .filter(BookingInventoryPolicy::blocksInventory)
                .filter(detail -> detail.getRoomType() != null && roomType.getId().equals(detail.getRoomType().getId()))
                .count();
        int totalPhysicalAvailable = (int) rooms.stream()
                .filter(this::isRoomAvailable)
                .count();
        int availableRooms = Math.max(0, totalPhysicalAvailable - (int) bookedCount);
        boolean allInMaintenance = !rooms.isEmpty() && totalPhysicalAvailable == 0;
        String status = allInMaintenance ? "MAINTENANCE" : (availableRooms > 0 ? "AVAILABLE" : "OCCUPIED");

        List<String> allUrls = rooms.stream()
                .flatMap(room -> roomImageRepository.findByRoomId(room.getId()).stream())
                .sorted(Comparator.comparing(RoomImage::isPrimary).reversed().thenComparing(Comparator.comparing(RoomImage::getId).reversed()))
                .map(RoomImage::getImageUrl)
                .toList();
        String primaryUrl = allUrls.isEmpty() ? null : allUrls.get(0);
        List<RoomPublicPriceResponse> prices = roomPriceConfigRepository.findByRoomTypeIdWithPolicy(roomType.getId()).stream()
                .map(this::toRoomPriceResponse)
                .toList();

        Room firstAvailable = rooms.stream()
                .filter(this::isRoomAvailable)
                .findFirst()
                .orElse(rooms.isEmpty() ? null : rooms.get(0));

        return new RoomTypeResponse(
                roomType.getId(),
                firstAvailable != null ? firstAvailable.getId() : null,
                roomType.getName(),
                roomType.getMaxAdults(),
                roomType.getMaxChildren(),
                roomType.getDescription(),
                findDisplayPrice(roomType.getId(), "WEEKDAY"),
                findDisplayPrice(roomType.getId(), "WEEKEND"),
                findDisplayRentType(roomType.getId()),
                availableRooms,
                status,
                primaryUrl,
                allUrls,
                prices,
                roomType.getVideoUrl(),
                roomType.getAverageRating() != null ? roomType.getAverageRating() : 5.0,
                roomType.getTotalReviews() != null ? roomType.getTotalReviews() : 0
        );
    }

    private BigDecimal findDisplayPrice(Long roomTypeId, String dayType) {
        List<RoomPriceConfig> allConfigs = roomPriceConfigRepository.findByRoomTypeIdWithPolicy(roomTypeId);

        // 1. Ưu tiên cao nhất: OVERNIGHT/BY_NIGHT/NIGHTLY/DAILY đúng dayType
        Optional<BigDecimal> preferred = allConfigs.stream()
                .filter(c -> dayType.equalsIgnoreCase(c.getDayType()))
                .filter(c -> PREFERRED_RENT_TYPES.contains(normalize(c.getPricePolicy().getRentType())))
                .min(Comparator.comparing(RoomPriceConfig::getPrice))
                .map(RoomPriceConfig::getPrice);
        if (preferred.isPresent()) return preferred.get();

        // 2. Fall back: PREFERRED không phân biệt dayType
        Optional<BigDecimal> preferredAny = allConfigs.stream()
                .filter(c -> PREFERRED_RENT_TYPES.contains(normalize(c.getPricePolicy().getRentType())))
                .min(Comparator.comparing(RoomPriceConfig::getPrice))
                .map(RoomPriceConfig::getPrice);
        if (preferredAny.isPresent()) return preferredAny.get();

        // 3. Fall back: bất kỳ giá nào đúng dayType
        Optional<BigDecimal> anyDayType = allConfigs.stream()
                .filter(c -> dayType.equalsIgnoreCase(c.getDayType()))
                .min(Comparator.comparing(RoomPriceConfig::getPrice))
                .map(RoomPriceConfig::getPrice);
        if (anyDayType.isPresent()) return anyDayType.get();

        // 4. Last resort: min toàn bộ
        return allConfigs.stream()
                .min(Comparator.comparing(RoomPriceConfig::getPrice))
                .map(RoomPriceConfig::getPrice)
                .orElse(BigDecimal.ZERO);
    }

    private String findDisplayRentType(Long roomTypeId) {
        List<RoomPriceConfig> allConfigs = roomPriceConfigRepository.findByRoomTypeIdWithPolicy(roomTypeId);
        // Ưu tiên OVERNIGHT/DAILY/BY_NIGHT trước
        Optional<String> preferred = allConfigs.stream()
                .filter(c -> PREFERRED_RENT_TYPES.contains(normalize(c.getPricePolicy().getRentType())))
                .map(c -> c.getPricePolicy().getRentType())
                .findFirst();
        if (preferred.isPresent()) return preferred.get();
        // Last resort
        return allConfigs.stream()
                .map(c -> c.getPricePolicy().getRentType())
                .findFirst()
                .orElse("OVERNIGHT");
    }

    private boolean isPreferredRentType(PricePolicy policy) {
        return policy != null && PREFERRED_RENT_TYPES.contains(normalize(policy.getRentType()));
    }

    private boolean isWeekend(LocalDate date) {
        DayOfWeek day = date.getDayOfWeek();
        return day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY;
    }

    private String normalizeDetailStatus(String status) {
        if (status == null) return "CONFIRMED";
        String s = status.trim().toUpperCase();
        if ("CHECKED_IN".equals(s)) return "CHECKED_IN";
        if ("PENDING".equals(s)) return "PENDING";
        if ("COMPLETED".equals(s)) return "CONFIRMED";
        if ("MAINTENANCE".equals(s)) return "CONFIRMED"; // Booking details must never be maintenance
        return s;
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase();
    }
}
