package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.response.*;
import com.homestayManagement.homestayManagement.entity.*;
import com.homestayManagement.homestayManagement.repository.*;
import com.homestayManagement.homestayManagement.service.AdminHousekeepingCalendarService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminHousekeepingCalendarServiceImpl implements AdminHousekeepingCalendarService {

    private static final Set<String> ACTIVE_BOOKING_STATUSES = Set.of("PENDING", "CONFIRMED", "CHECKED_IN");

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
                .filter(detail -> ACTIVE_BOOKING_STATUSES.contains(normalize(detail.getStatus())))
                .filter(detail -> ACTIVE_BOOKING_STATUSES.contains(normalize(detail.getBooking().getStatus())))
                .collect(Collectors.groupingBy(detail -> detail.getRoom().getId()));
        Map<Long, List<RoomSchedule>> schedulesByRoom = roomScheduleRepository.findOverlapping(rangeStart, rangeEnd).stream()
                .filter(schedule -> roomIds.contains(schedule.getRoom().getId()))
                .collect(Collectors.groupingBy(schedule -> schedule.getRoom().getId()));
        Map<Long, List<HousekeepingTask>> tasksByRoom = housekeepingTaskRepository.findAllForHousekeeping().stream()
                .filter(task -> roomIds.contains(task.getRoom().getId()))
                .filter(task -> task.getStartedAt() != null)
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

            RoomSchedule maintenance = schedules.stream()
                    .filter(schedule -> "MAINTENANCE".equals(normalize(schedule.getStatus())))
                    .filter(schedule -> overlaps(schedule.getStartTime(), schedule.getEndTime(), dayStart, dayEnd))
                    .findFirst().orElse(null);
            if (maintenance != null || (date.equals(LocalDate.now()) && "MAINTENANCE".equals(normalize(room.getStatus())))) {
                result.add(emptyDay(date, "MAINTENANCE", maintenance == null ? "Phòng đang bảo trì" : maintenance.getNote()));
                continue;
            }

            HousekeepingTask cleaningTask = tasks.stream()
                    .filter(task -> overlaps(task.getStartedAt(), taskEnd(task), dayStart, dayEnd))
                    .max(Comparator.comparing(HousekeepingTask::getStartedAt)).orElse(null);
            if (cleaningTask != null) {
                List<HousekeepingTaskChecklistItem> checklist = checklistByTask.getOrDefault(cleaningTask.getId(), List.of());
                int completed = (int) checklist.stream().filter(HousekeepingTaskChecklistItem::isCompleted).count();
                Employee assigned = cleaningTask.getAssignedHousekeeping();
                result.add(new AdminHousekeepingCalendarDayResponse(
                        date, "CLEANING", null, null, null, null, null,
                        cleaningTask.getId(), assigned == null ? null : assigned.getFullName(),
                        completed, checklist.size(), cleaningTask.getNote()
                ));
                continue;
            }

            BookingDetail booking = bookings.stream()
                    .filter(detail -> overlaps(detail.getCheckInTarget(), detail.getCheckOutTarget(), dayStart, dayEnd))
                    .max(Comparator.comparingInt(this::bookingPriority)).orElse(null);
            if (booking != null) {
                String status = "CHECKED_IN".equals(normalize(booking.getStatus())) ? "OCCUPIED" : "BOOKED";
                result.add(new AdminHousekeepingCalendarDayResponse(
                        date, status, booking.getBooking().getId(), booking.getId(),
                        booking.getBooking().getCustomer().getFullName(), booking.getCheckInTarget(), booking.getCheckOutTarget(),
                        null, null, null, null, null
                ));
                continue;
            }

            result.add(emptyDay(date, "AVAILABLE", null));
        }
        return result;
    }

    private AdminHousekeepingCalendarDayResponse emptyDay(LocalDate date, String status, String note) {
        return new AdminHousekeepingCalendarDayResponse(
                date, status, null, null, null, null, null, null, null, null, null, note
        );
    }

    private AdminHousekeepingCalendarSummaryResponse summarize(List<AdminHousekeepingCalendarRoomResponse> rooms) {
        Map<String, Long> counts = rooms.stream()
                .filter(room -> !room.days().isEmpty())
                .collect(Collectors.groupingBy(room -> room.days().get(0).status(), Collectors.counting()));
        return new AdminHousekeepingCalendarSummaryResponse(
                counts.getOrDefault("AVAILABLE", 0L).intValue(),
                counts.getOrDefault("BOOKED", 0L).intValue(),
                counts.getOrDefault("OCCUPIED", 0L).intValue(),
                counts.getOrDefault("CLEANING", 0L).intValue(),
                counts.getOrDefault("MAINTENANCE", 0L).intValue()
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
