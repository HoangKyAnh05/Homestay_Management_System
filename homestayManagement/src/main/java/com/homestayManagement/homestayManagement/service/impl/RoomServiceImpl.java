package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.response.RoomSearchResponse;
import com.homestayManagement.homestayManagement.dto.response.RoomTypeResponse;
import com.homestayManagement.homestayManagement.entity.BookingDetail;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class RoomServiceImpl implements RoomService {

    private static final Set<String> ACTIVE_BOOKING_STATUSES = Set.of("PENDING", "CONFIRMED", "CHECKED_IN");
    private static final Set<String> PREFERRED_RENT_TYPES = Set.of("OVERNIGHT", "DAILY", "BY_NIGHT", "NIGHTLY");

    private final RoomTypeRepository roomTypeRepository;
    private final RoomRepository roomRepository;
    private final RoomImageRepository roomImageRepository;
    private final BookingDetailRepository bookingDetailRepository;
    private final RoomPriceConfigRepository roomPriceConfigRepository;

    public RoomServiceImpl(
            RoomTypeRepository roomTypeRepository,
            RoomRepository roomRepository,
            RoomImageRepository roomImageRepository,
            BookingDetailRepository bookingDetailRepository,
            RoomPriceConfigRepository roomPriceConfigRepository
    ) {
        this.roomTypeRepository = roomTypeRepository;
        this.roomRepository = roomRepository;
        this.roomImageRepository = roomImageRepository;
        this.bookingDetailRepository = bookingDetailRepository;
        this.roomPriceConfigRepository = roomPriceConfigRepository;
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
    public List<RoomSearchResponse> searchAvailableRooms(
            LocalDate checkInDate,
            LocalDate checkOutDate,
            Integer rooms,
            Integer adults,
            Integer children,
            BigDecimal maxPrice
    ) {
        validateSearch(checkInDate, checkOutDate, rooms, adults, children);

        LocalDateTime startInclusive = checkInDate.atStartOfDay();
        LocalDateTime endExclusive = checkOutDate.atStartOfDay();
        Set<Long> busyRoomIds = bookingDetailRepository.findOverlappingSchedule(startInclusive, endExclusive)
                .stream()
                .filter(this::isActiveBooking)
                .map(detail -> detail.getRoom().getId())
                .collect(Collectors.toSet());

        int requestedRooms = rooms != null ? rooms : 1;
        int adultsPerRoom = (int) Math.ceil((adults != null ? adults : 1) / (double) requestedRooms);
        int childrenPerRoom = (int) Math.ceil((children != null ? children : 0) / (double) requestedRooms);
        String dayType = isWeekend(checkInDate) ? "WEEKEND" : "WEEKDAY";

        return roomRepository.findAllWithRoomType().stream()
                .filter(room -> !busyRoomIds.contains(room.getId()))
                .filter(room -> hasCapacity(room.getRoomType(), adultsPerRoom, childrenPerRoom))
                .map(room -> toSearchResponse(room, dayType))
                .flatMap(Optional::stream)
                .filter(room -> maxPrice == null || room.price().compareTo(maxPrice) <= 0)
                .sorted(Comparator.comparing(RoomSearchResponse::price)
                        .thenComparing(RoomSearchResponse::roomNumber, Comparator.nullsLast(String::compareToIgnoreCase)))
                .toList();
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
        String detailStatus = normalize(detail.getStatus());
        String bookingStatus = normalize(detail.getBooking().getStatus());
        return ACTIVE_BOOKING_STATUSES.contains(detailStatus) && ACTIVE_BOOKING_STATUSES.contains(bookingStatus);
    }

    private boolean hasCapacity(RoomType roomType, int adultsPerRoom, int childrenPerRoom) {
        if (roomType == null) {
            return false;
        }
        return roomType.getMaxAdults() >= adultsPerRoom && roomType.getMaxChildren() >= childrenPerRoom;
    }

    private Optional<RoomSearchResponse> toSearchResponse(Room room, String dayType) {
        RoomType roomType = room.getRoomType();
        List<RoomPriceConfig> configs = roomPriceConfigRepository.findByRoomTypeIdWithPolicy(roomType.getId()).stream()
                .filter(config -> dayType.equalsIgnoreCase(config.getDayType()))
                .toList();
        Optional<RoomPriceConfig> priceConfig = configs.stream()
                .filter(config -> isPreferredRentType(config.getPricePolicy()))
                .min(Comparator.comparing(RoomPriceConfig::getPrice))
                .or(() -> configs.stream().min(Comparator.comparing(RoomPriceConfig::getPrice)));
        if (priceConfig.isEmpty()) {
            return Optional.empty();
        }

        List<String> imageUrls = roomImageRepository.findByRoomId(room.getId()).stream()
                .sorted(Comparator.comparing(RoomImage::isPrimary).reversed().thenComparing(RoomImage::getId))
                .map(RoomImage::getImageUrl)
                .toList();
        String primaryImageUrl = imageUrls.isEmpty() ? null : imageUrls.get(0);

        return Optional.of(new RoomSearchResponse(
                room.getId(),
                room.getRoomNumber(),
                roomType.getId(),
                roomType.getName(),
                roomType.getMaxAdults(),
                roomType.getMaxChildren(),
                roomType.getDescription(),
                priceConfig.get().getPrice(),
                priceConfig.get().getPricePolicy().getRentType(),
                primaryImageUrl,
                imageUrls
        ));
    }

    private RoomTypeResponse toRoomTypeResponse(RoomType roomType) {
        List<Room> rooms = roomRepository.findByRoomTypeId(roomType.getId());
        List<String> allUrls = rooms.stream()
                .flatMap(room -> roomImageRepository.findByRoomId(room.getId()).stream())
                .sorted(Comparator.comparing(RoomImage::isPrimary).reversed().thenComparing(RoomImage::getId))
                .map(RoomImage::getImageUrl)
                .toList();
        String primaryUrl = allUrls.isEmpty() ? null : allUrls.get(0);

        return new RoomTypeResponse(
                roomType.getId(),
                roomType.getName(),
                roomType.getMaxAdults(),
                roomType.getMaxChildren(),
                roomType.getDescription(),
                findDisplayPrice(roomType.getId(), "WEEKDAY"),
                findDisplayPrice(roomType.getId(), "WEEKEND"),
                findDisplayRentType(roomType.getId()),
                primaryUrl,
                allUrls
        );
    }

    private BigDecimal findDisplayPrice(Long roomTypeId, String dayType) {
        return roomPriceConfigRepository.findByRoomTypeIdWithPolicy(roomTypeId).stream()
                .filter(config -> dayType.equalsIgnoreCase(config.getDayType()))
                .filter(config -> isPreferredRentType(config.getPricePolicy()))
                .min(Comparator.comparing(RoomPriceConfig::getPrice))
                .or(() -> roomPriceConfigRepository.findByRoomTypeIdWithPolicy(roomTypeId).stream()
                        .filter(config -> dayType.equalsIgnoreCase(config.getDayType()))
                        .min(Comparator.comparing(RoomPriceConfig::getPrice)))
                .map(RoomPriceConfig::getPrice)
                .orElse(BigDecimal.ZERO);
    }

    private String findDisplayRentType(Long roomTypeId) {
        return roomPriceConfigRepository.findByRoomTypeIdWithPolicy(roomTypeId).stream()
                .filter(config -> isPreferredRentType(config.getPricePolicy()))
                .min(Comparator.comparing(RoomPriceConfig::getPrice))
                .map(config -> config.getPricePolicy().getRentType())
                .or(() -> roomPriceConfigRepository.findByRoomTypeIdWithPolicy(roomTypeId).stream()
                        .min(Comparator.comparing(RoomPriceConfig::getPrice))
                        .map(config -> config.getPricePolicy().getRentType()))
                .orElse("OVERNIGHT");
    }

    private boolean isPreferredRentType(PricePolicy policy) {
        return policy != null && PREFERRED_RENT_TYPES.contains(normalize(policy.getRentType()));
    }

    private boolean isWeekend(LocalDate date) {
        DayOfWeek day = date.getDayOfWeek();
        return day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY;
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase();
    }
}
