package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.response.*;
import com.homestayManagement.homestayManagement.entity.*;
import com.homestayManagement.homestayManagement.repository.*;
import com.homestayManagement.homestayManagement.service.AdminHousekeepingCalendarService;
import com.homestayManagement.homestayManagement.service.support.BookingInventoryPolicy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminHousekeepingCalendarServiceImpl implements AdminHousekeepingCalendarService {

    private final RoomRepository roomRepository;
    private final BookingDetailRepository bookingDetailRepository;
    private final HousekeepingTaskRepository housekeepingTaskRepository;
    private final HousekeepingTaskChecklistItemRepository taskChecklistItemRepository;
    private final RoomScheduleRepository roomScheduleRepository;

    public AdminHousekeepingCalendarServiceImpl(
            RoomRepository roomRepository,
            BookingDetailRepository bookingDetailRepository,
            HousekeepingTaskRepository housekeepingTaskRepository,
            HousekeepingTaskChecklistItemRepository taskChecklistItemRepository,
            RoomScheduleRepository roomScheduleRepository
    ) {
        this.roomRepository = roomRepository;
        this.bookingDetailRepository = bookingDetailRepository;
        this.housekeepingTaskRepository = housekeepingTaskRepository;
        this.taskChecklistItemRepository = taskChecklistItemRepository;
        this.roomScheduleRepository = roomScheduleRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public AdminHousekeepingCalendarResponse getCalendar(LocalDate startDate, int days, Long roomTypeId) {
        if (days < 1 || days > 31) throw new IllegalArgumentException("Số ngày hiển thị phải từ 1 đến 31");
        LocalDate normalizedStart = startDate == null ? LocalDate.now() : startDate;
        LocalDate endDate = normalizedStart.plusDays(days - 1L);
        LocalDateTime rangeStart = normalizedStart.atStartOfDay();
        LocalDateTime rangeEnd = endDate.plusDays(1).atStartOfDay();

        List<Room> rooms = roomRepository.findAllWithRoomType().stream()
                .filter(room -> roomTypeId == null || room.getRoomType().getId().equals(roomTypeId))
                .toList();
        Set<Long> roomIds = rooms.stream().map(Room::getId).collect(Collectors.toSet());

        Map<Long, List<BookingDetail>> bookingsByRoom = bookingDetailRepository
                .findOverlappingSchedule(rangeStart, rangeEnd).stream()
                .filter(detail -> detail.getRoom() != null && roomIds.contains(detail.getRoom().getId()))
                .filter(BookingInventoryPolicy::blocksInventory)
                .collect(Collectors.groupingBy(detail -> detail.getRoom().getId()));
        Map<Long, List<RoomSchedule>> schedulesByRoom = roomScheduleRepository.findOverlapping(rangeStart, rangeEnd).stream()
                .filter(schedule -> roomIds.contains(schedule.getRoom().getId()))
                .collect(Collectors.groupingBy(schedule -> schedule.getRoom().getId()));
        Map<Long, List<HousekeepingTask>> tasksByRoom = housekeepingTaskRepository.findAllForHousekeeping().stream()
                .filter(task -> roomIds.contains(task.getRoom().getId()))
                .filter(task -> task.getStartedAt() != null)
                .filter(task -> !"COMPLETED".equals(normalize(task.getCleaningStatus())))
                .filter(task -> overlaps(task.getStartedAt(), taskEnd(task), rangeStart, rangeEnd))
                .collect(Collectors.groupingBy(task -> task.getRoom().getId()));
        Map<Long, List<HousekeepingTaskChecklistItem>> checklistByTask = taskChecklistItemRepository.findAll().stream()
                .collect(Collectors.groupingBy(item -> item.getHousekeepingTask().getId()));

        List<AdminHousekeepingCalendarRoomResponse> roomRows = rooms.stream()
                .map(room -> new AdminHousekeepingCalendarRoomResponse(
                        room.getId(), room.getRoomNumber(), room.getRoomType().getId(), room.getRoomType().getName(),
                        room.getStatus(),
                        buildDays(room, normalizedStart, days,
                                bookingsByRoom.getOrDefault(room.getId(), List.of()),
                                tasksByRoom.getOrDefault(room.getId(), List.of()),
                                schedulesByRoom.getOrDefault(room.getId(), List.of()),
                                checklistByTask)
                ))
                .toList();

        return new AdminHousekeepingCalendarResponse(
                normalizedStart, endDate, summarize(roomRows), roomRows
        );
    }

    @Override
    @Transactional(readOnly = true)
    public AdminHousekeepingCleaningTraceResponse getLatestCleaningTrace(Long roomId, LocalDateTime completedBefore) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phòng"));
        LocalDateTime cutoff = completedBefore == null ? LocalDateTime.now() : completedBefore;
        HousekeepingTask task = housekeepingTaskRepository
                .findFirstByRoomIdAndCleaningCompletedAtIsNotNullAndCleaningCompletedAtLessThanEqualOrderByCleaningCompletedAtDesc(roomId, cutoff)
                .orElse(null);
        if (task == null) {
            return new AdminHousekeepingCleaningTraceResponse(
                    room.getId(), room.getRoomNumber(), null, null, null, null, null, null, null, List.of()
            );
        }

        Employee employee = task.getAssignedHousekeeping();
        Long durationMinutes = task.getStartedAt() == null || task.getCleaningCompletedAt() == null
                ? null
                : Math.max(0, ChronoUnit.MINUTES.between(task.getStartedAt(), task.getCleaningCompletedAt()));
        List<HousekeepingCleaningChecklistItemResponse> checklist = taskChecklistItemRepository
                .findByHousekeepingTaskIdOrderByDisplayOrderAsc(task.getId()).stream()
                .map(item -> new HousekeepingCleaningChecklistItemResponse(
                        item.getId(), item.getTitleSnapshot(), item.getDescriptionSnapshot(), item.isRequired(),
                        item.getDisplayOrder(), item.isCompleted(),
                        item.getCompletedBy() == null ? null : item.getCompletedBy().getId(),
                        item.getCompletedBy() == null ? null : item.getCompletedBy().getFullName(),
                        item.getCompletedAt()
                ))
                .toList();
        return new AdminHousekeepingCleaningTraceResponse(
                room.getId(), room.getRoomNumber(), task.getId(),
                employee == null ? null : employee.getId(), employee == null ? null : employee.getFullName(),
                task.getStartedAt(), task.getCleaningCompletedAt(), durationMinutes, task.getNote(), checklist
        );
    }

    private List<AdminHousekeepingCalendarDayResponse> buildDays(
            Room room,
            LocalDate startDate,
            int days,
            List<BookingDetail> bookings,
            List<HousekeepingTask> tasks,
            List<RoomSchedule> schedules,
            Map<Long, List<HousekeepingTaskChecklistItem>> checklistByTask
    ) {
        List<AdminHousekeepingCalendarDayResponse> result = new ArrayList<>();
        for (int offset = 0; offset < days; offset++) {
            LocalDate date = startDate.plusDays(offset);
            LocalDateTime dayStart = date.atStartOfDay();
            LocalDateTime dayEnd = date.plusDays(1).atStartOfDay();

            // 1. Kiểm tra Housekeeping task cho ngày này
            HousekeepingTask cleaningTask = tasks.stream()
                    .filter(task -> overlaps(task.getStartedAt(), taskEnd(task), dayStart, dayEnd))
                    .max(Comparator.comparing(HousekeepingTask::getStartedAt)).orElse(null);
            String hkStatus = null;
            Long hkTaskId = null;
            String hkAssignedName = null;
            Integer checklistCompleted = null;
            Integer checklistTotal = null;
            String hkNote = null;

            if (cleaningTask != null) {
                hkStatus = "CLEANING";
                hkTaskId = cleaningTask.getId();
                Employee assigned = cleaningTask.getAssignedHousekeeping();
                hkAssignedName = assigned == null ? null : assigned.getFullName();
                List<HousekeepingTaskChecklistItem> checklist = checklistByTask.getOrDefault(cleaningTask.getId(), List.of());
                checklistCompleted = (int) checklist.stream().filter(HousekeepingTaskChecklistItem::isCompleted).count();
                checklistTotal = checklist.size();
                hkNote = cleaningTask.getNote();
            } else if (date.equals(LocalDate.now()) && "DIRTY".equalsIgnoreCase(room.getStatus())) {
                hkStatus = "DIRTY";
            }

            // 2. Kiểm tra Booking theo dải ngày (night-based occupancy)
            BookingDetail booking = bookings.stream()
                    .filter(detail -> {
                        if (detail.getCheckInTarget() == null || detail.getCheckOutTarget() == null) return false;
                        LocalDate cin = detail.getCheckInTarget().toLocalDate();
                        LocalDate cout = detail.getCheckOutTarget().toLocalDate();
                        return (cin.equals(cout) && date.equals(cin)) || (!date.isBefore(cin) && date.isBefore(cout));
                    })
                    .max(Comparator.comparingInt(this::bookingPriority)).orElse(null);

            // 3. Kiểm tra Maintenance schedule
            RoomSchedule maintenance = schedules.stream()
                    .filter(schedule -> "MAINTENANCE".equals(normalize(schedule.getStatus())))
                    .filter(schedule -> overlaps(schedule.getStartTime(), schedule.getEndTime(), dayStart, dayEnd))
                    .findFirst().orElse(null);
            boolean isRoomMaintenance = maintenance != null || (date.equals(LocalDate.now()) && "MAINTENANCE".equalsIgnoreCase(room.getStatus()));

            // 4. Thứ tự ưu tiên xác định trạng thái phòng:
            // Ưu tiên 1: OCCUPIED (Đang ở)
            // Ưu tiên 2: BOOKED (Đã đặt)
            // Ưu tiên 3: MAINTENANCE (Bảo trì)
            // Ưu tiên 4: CLEANING (Nếu đang dọn) / AVAILABLE (Trống)
            String mainStatus;
            String bookingStatus = null;
            if (booking != null) {
                bookingStatus = normalize(booking.getStatus());
                if ("CHECKED_IN".equals(bookingStatus)) {
                    mainStatus = "OCCUPIED";
                } else {
                    mainStatus = "BOOKED";
                }
            } else if (isRoomMaintenance) {
                mainStatus = "MAINTENANCE";
            } else if (cleaningTask != null) {
                mainStatus = "CLEANING";
            } else {
                mainStatus = "AVAILABLE";
            }

            String finalNote = booking != null ? null : (maintenance != null ? maintenance.getNote() : hkNote);

            result.add(new AdminHousekeepingCalendarDayResponse(
                    room.getId(),
                    date,
                    mainStatus,
                    bookingStatus,
                    hkStatus,
                    booking != null ? booking.getBooking().getId() : null,
                    booking != null ? booking.getBooking().getBookingCode() : null,
                    booking != null ? booking.getId() : null,
                    booking != null && booking.getBooking().getCustomer() != null ? booking.getBooking().getCustomer().getFullName() : null,
                    booking != null ? booking.getCheckInTarget() : null,
                    booking != null ? booking.getCheckOutTarget() : null,
                    hkTaskId,
                    hkAssignedName,
                    checklistCompleted,
                    checklistTotal,
                    finalNote
            ));
        }
        return result;
    }

    private AdminHousekeepingCalendarSummaryResponse summarize(List<AdminHousekeepingCalendarRoomResponse> rooms) {
        int available = 0;
        int booked = 0;
        int occupied = 0;
        int cleaning = 0;
        int maintenance = 0;

        for (AdminHousekeepingCalendarRoomResponse room : rooms) {
            if (room.days().isEmpty()) continue;
            AdminHousekeepingCalendarDayResponse today = room.days().get(0);
            if ("CLEANING".equals(today.housekeepingStatus()) || "CLEANING".equals(today.status())) {
                cleaning++;
            }
            switch (today.status()) {
                case "OCCUPIED" -> occupied++;
                case "BOOKED" -> booked++;
                case "MAINTENANCE" -> maintenance++;
                case "CLEANING" -> available++;
                default -> available++;
            }
        }
        return new AdminHousekeepingCalendarSummaryResponse(
                available, booked, occupied, cleaning, maintenance
        );
    }

    private int bookingPriority(BookingDetail detail) {
        return "CHECKED_IN".equals(normalize(detail.getStatus())) ? 2 : 1;
    }

    private LocalDateTime taskEnd(HousekeepingTask task) {
        return task.getCleaningCompletedAt() == null ? LocalDateTime.now() : task.getCleaningCompletedAt();
    }

    private boolean overlaps(LocalDateTime start, LocalDateTime end, LocalDateTime rangeStart, LocalDateTime rangeEnd) {
        return start != null && end != null && start.isBefore(rangeEnd) && end.isAfter(rangeStart);
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
    }
}
