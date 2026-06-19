package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.request.HousekeepingInspectionItemRequest;
import com.homestayManagement.homestayManagement.dto.request.HousekeepingInspectionRequest;
import com.homestayManagement.homestayManagement.dto.request.HousekeepingCleaningCompletionRequest;
import com.homestayManagement.homestayManagement.dto.request.HousekeepingCleaningItemRequest;
import com.homestayManagement.homestayManagement.dto.response.HousekeepingMiniBarItemResponse;
import com.homestayManagement.homestayManagement.dto.response.HousekeepingPenaltyItemResponse;
import com.homestayManagement.homestayManagement.dto.response.HousekeepingTaskResponse;
import com.homestayManagement.homestayManagement.dto.response.HousekeepingCleaningChecklistItemResponse;
import com.homestayManagement.homestayManagement.entity.*;
import com.homestayManagement.homestayManagement.repository.*;
import com.homestayManagement.homestayManagement.service.AdminBookingService;
import com.homestayManagement.homestayManagement.service.HousekeepingService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class HousekeepingServiceImpl implements HousekeepingService {

    private static final Set<String> FILTER_STATUSES = Set.of(
            "PENDING", "IN_PROGRESS", "INSPECTED", "COMPLETED", "ALL"
    );

    private final HousekeepingTaskRepository housekeepingTaskRepository;
    private final BookingDetailRepository bookingDetailRepository;
    private final CheckInRecordRepository checkInRecordRepository;
    private final EmployeeRepository employeeRepository;
    private final RoomRepository roomRepository;
    private final RoomMiniBarItemRepository roomMiniBarItemRepository;
    private final RoomAmenitiesUsageRepository roomAmenitiesUsageRepository;
    private final RulesPenaltyRepository rulesPenaltyRepository;
    private final AppliedPenaltyRepository appliedPenaltyRepository;
    private final AdminBookingService adminBookingService;
    private final HousekeepingChecklistTemplateRepository checklistTemplateRepository;
    private final HousekeepingTaskChecklistItemRepository taskChecklistItemRepository;

    public HousekeepingServiceImpl(
            HousekeepingTaskRepository housekeepingTaskRepository,
            BookingDetailRepository bookingDetailRepository,
            CheckInRecordRepository checkInRecordRepository,
            EmployeeRepository employeeRepository,
            RoomRepository roomRepository,
            RoomMiniBarItemRepository roomMiniBarItemRepository,
            RoomAmenitiesUsageRepository roomAmenitiesUsageRepository,
            RulesPenaltyRepository rulesPenaltyRepository,
            AppliedPenaltyRepository appliedPenaltyRepository,
            AdminBookingService adminBookingService,
            HousekeepingChecklistTemplateRepository checklistTemplateRepository,
            HousekeepingTaskChecklistItemRepository taskChecklistItemRepository
    ) {
        this.housekeepingTaskRepository = housekeepingTaskRepository;
        this.bookingDetailRepository = bookingDetailRepository;
        this.checkInRecordRepository = checkInRecordRepository;
        this.employeeRepository = employeeRepository;
        this.roomRepository = roomRepository;
        this.roomMiniBarItemRepository = roomMiniBarItemRepository;
        this.roomAmenitiesUsageRepository = roomAmenitiesUsageRepository;
        this.rulesPenaltyRepository = rulesPenaltyRepository;
        this.appliedPenaltyRepository = appliedPenaltyRepository;
        this.adminBookingService = adminBookingService;
        this.checklistTemplateRepository = checklistTemplateRepository;
        this.taskChecklistItemRepository = taskChecklistItemRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<HousekeepingTaskResponse> getTasks(String status) {
        String normalized = normalize(status == null ? "ALL" : status);
        if (!FILTER_STATUSES.contains(normalized)) {
            throw new IllegalArgumentException("Trạng thái lọc housekeeping không hợp lệ");
        }
        return housekeepingTaskRepository.findAllForHousekeeping().stream()
                .filter(task -> matchesFilter(task, normalized))
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public HousekeepingTaskResponse getTask(Long taskId) {
        return toResponse(getTaskEntity(taskId));
    }

    @Override
    @Transactional(readOnly = true)
    public HousekeepingTaskResponse getTaskByBookingDetail(Long bookingDetailId) {
        return housekeepingTaskRepository.findByBookingDetailIdForDetail(bookingDetailId)
                .map(this::toResponse)
                .orElseThrow(() -> new IllegalArgumentException("Chưa có yêu cầu kiểm tra phòng"));
    }

    @Override
    @Transactional
    public HousekeepingTaskResponse requestInspection(Long bookingDetailId) {
        Optional<HousekeepingTask> existing = housekeepingTaskRepository.findByBookingDetailIdForDetail(bookingDetailId);
        if (existing.isPresent()) {
            ensureChecklistSnapshot(existing.get());
            return toResponse(existing.get());
        }

        BookingDetail detail = bookingDetailRepository.findByIdForAdminDetail(bookingDetailId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn đặt phòng"));
        if (!"CHECKED_IN".equalsIgnoreCase(detail.getStatus())) {
            throw new IllegalArgumentException("Chỉ phòng đang lưu trú mới được yêu cầu kiểm tra");
        }
        if (detail.getRoom() == null) {
            throw new IllegalArgumentException("Booking chưa được gán phòng");
        }
        CheckInRecord record = checkInRecordRepository.findByBookingDetailId(bookingDetailId)
                .orElseThrow(() -> new IllegalArgumentException("Phòng này chưa check-in"));
        if (record.getActualCheckOut() != null) {
            throw new IllegalArgumentException("Phòng này đã hoàn tất checkout");
        }

        HousekeepingTask task = HousekeepingTask.builder()
                .checkInRecord(record)
                .room(detail.getRoom())
                .requestedBy(getCurrentEmployee())
                .inspectionStatus("PENDING")
                .cleaningStatus("PENDING")
                .requestedAt(LocalDateTime.now())
                .build();
        HousekeepingTask savedTask = housekeepingTaskRepository.save(task);
        ensureChecklistSnapshot(savedTask);
        return toResponse(savedTask);
    }

    @Override
    @Transactional
    public HousekeepingTaskResponse startTask(Long taskId) {
        HousekeepingTask task = getTaskEntity(taskId);
        if ("COMPLETED".equalsIgnoreCase(task.getCleaningStatus())) {
            throw new IllegalArgumentException("Công việc dọn phòng đã hoàn tất");
        }
        if ("MAINTENANCE".equalsIgnoreCase(task.getRoom().getStatus())) {
            throw new IllegalArgumentException("Phòng đang bảo trì, không thể bắt đầu dọn phòng");
        }

        Employee employee = getCurrentEmployee();
        requireOwnerOrAdmin(task, employee);
        if (task.getAssignedHousekeeping() == null) task.setAssignedHousekeeping(employee);
        if (task.getStartedAt() == null) task.setStartedAt(LocalDateTime.now());
        if ("PENDING".equalsIgnoreCase(task.getInspectionStatus())) task.setInspectionStatus("IN_PROGRESS");
        if ("PENDING".equalsIgnoreCase(task.getCleaningStatus())) task.setCleaningStatus("IN_PROGRESS");
        task.getRoom().setStatus("CLEANING");
        roomRepository.save(task.getRoom());
        task.getCheckInRecord().setHousekeeping(task.getAssignedHousekeeping());
        checkInRecordRepository.save(task.getCheckInRecord());
        ensureChecklistSnapshot(task);
        return toResponse(housekeepingTaskRepository.save(task));
    }

    @Override
    @Transactional
    public HousekeepingTaskResponse submitInspection(Long taskId, HousekeepingInspectionRequest request) {
        HousekeepingTask task = getTaskEntity(taskId);
        Employee employee = getCurrentEmployee();
        requireOwnerOrAdmin(task, employee);
        if (task.getAssignedHousekeeping() == null || task.getStartedAt() == null) {
            throw new IllegalArgumentException("Vui lòng bắt đầu công việc trước khi gửi kết quả kiểm tra");
        }
        if ("COMPLETED".equalsIgnoreCase(task.getInspectionStatus())) {
            throw new IllegalArgumentException("Kết quả kiểm tra đã được gửi cho lễ tân");
        }

        Map<Long, HousekeepingInspectionItemRequest> requestedItems = new LinkedHashMap<>();
        for (HousekeepingInspectionItemRequest item : request.items()) {
            if (requestedItems.putIfAbsent(item.itemId(), item) != null) {
                throw new IllegalArgumentException("Danh sách mini-bar có mặt hàng bị trùng");
            }
        }

        Map<Long, RoomMiniBarItem> catalog = roomMiniBarItemRepository.findAll().stream()
                .collect(Collectors.toMap(RoomMiniBarItem::getId, Function.identity()));
        for (HousekeepingInspectionItemRequest item : requestedItems.values()) {
            RoomMiniBarItem catalogItem = catalog.get(item.itemId());
            if (catalogItem == null) {
                throw new IllegalArgumentException("Không tìm thấy mặt hàng mini-bar #" + item.itemId());
            }
            if (item.quantityUsed() > catalogItem.getQuantityInStock()) {
                throw new IllegalArgumentException("Số lượng " + catalogItem.getName() + " vượt quá tồn kho hiện tại");
            }
        }

        Long checkInRecordId = task.getCheckInRecord().getId();
        roomAmenitiesUsageRepository.deleteByCheckInRecordId(checkInRecordId);
        roomAmenitiesUsageRepository.flush();
        List<RoomAmenitiesUsage> usages = requestedItems.values().stream()
                .filter(item -> item.quantityUsed() > 0)
                .map(item -> RoomAmenitiesUsage.builder()
                        .checkInRecord(task.getCheckInRecord())
                        .item(catalog.get(item.itemId()))
                        .quantityUsed(item.quantityUsed())
                        .build())
                .toList();
        roomAmenitiesUsageRepository.saveAll(usages);

        Set<Long> penaltyRuleIds = new LinkedHashSet<>(request.penaltyRuleIds());
        if (penaltyRuleIds.size() != request.penaltyRuleIds().size()) {
            throw new IllegalArgumentException("Danh sách khoản phạt có nội quy bị trùng");
        }
        Map<Long, RulesPenalty> penaltyCatalog = rulesPenaltyRepository.findAll().stream()
                .collect(Collectors.toMap(RulesPenalty::getId, Function.identity()));
        for (Long ruleId : penaltyRuleIds) {
            if (!penaltyCatalog.containsKey(ruleId)) {
                throw new IllegalArgumentException("Không tìm thấy khoản phạt #" + ruleId);
            }
        }
        appliedPenaltyRepository.deleteByCheckRecordId(checkInRecordId);
        appliedPenaltyRepository.flush();
        appliedPenaltyRepository.saveAll(penaltyRuleIds.stream()
                .map(ruleId -> {
                    RulesPenalty rule = penaltyCatalog.get(ruleId);
                    return AppliedPenalty.builder()
                            .checkRecord(task.getCheckInRecord())
                            .rulesPenalty(rule)
                            .actualFine(rule.getPenaltyAmount())
                            .description("Ghi nhận khi housekeeping kiểm tra phòng")
                            .build();
                })
                .toList());

        task.setNote(blankToNull(request.note()));
        task.setInspectionStatus("COMPLETED");
        task.setInspectionCompletedAt(LocalDateTime.now());
        housekeepingTaskRepository.save(task);

        // Làm mới hóa đơn ngay sau khi chốt minibar; checkout không cần chờ dọn phòng xong.
        adminBookingService.generateInvoice(task.getCheckInRecord().getBookingDetail().getId());
        return toResponse(getTaskEntity(taskId));
    }

    @Override
    @Transactional
    public HousekeepingTaskResponse completeCleaning(Long taskId, HousekeepingCleaningCompletionRequest request) {
        HousekeepingTask task = getTaskEntity(taskId);
        Employee employee = getCurrentEmployee();
        requireOwnerOrAdmin(task, employee);
        if (!"COMPLETED".equalsIgnoreCase(task.getInspectionStatus())) {
            throw new IllegalArgumentException("Vui lòng gửi kết quả kiểm tra trước khi hoàn tất dọn phòng");
        }
        if ("MAINTENANCE".equalsIgnoreCase(task.getRoom().getStatus())) {
            throw new IllegalArgumentException("Phòng đang bảo trì, không thể chuyển sang sẵn sàng");
        }
        if ("COMPLETED".equalsIgnoreCase(task.getCleaningStatus())) return toResponse(task);

        ensureChecklistSnapshot(task);
        List<HousekeepingTaskChecklistItem> checklist = taskChecklistItemRepository
                .findByHousekeepingTaskIdOrderByDisplayOrderAsc(taskId);
        applyChecklistCompletion(checklist, request.items(), employee);
        taskChecklistItemRepository.saveAll(checklist);

        task.setCleaningStatus("COMPLETED");
        task.setCleaningCompletedAt(LocalDateTime.now());
        task.getRoom().setStatus("AVAILABLE");
        roomRepository.save(task.getRoom());
        return toResponse(housekeepingTaskRepository.save(task));
    }

    private void ensureChecklistSnapshot(HousekeepingTask task) {
        if (task.getId() == null || taskChecklistItemRepository.existsByHousekeepingTaskId(task.getId())) return;

        Optional<HousekeepingChecklistTemplate> roomOverride = checklistTemplateRepository.findByRoomId(task.getRoom().getId());
        HousekeepingChecklistTemplate template = roomOverride.orElseGet(() -> checklistTemplateRepository
                .findByRoomTypeIdAndRoomIsNull(task.getRoom().getRoomType().getId())
                .orElse(null));
        if (template == null || !template.isActive()) return;

        List<HousekeepingTaskChecklistItem> snapshot = template.getItems().stream()
                .filter(HousekeepingChecklistItem::isActive)
                .sorted(Comparator.comparing(HousekeepingChecklistItem::getDisplayOrder))
                .map(item -> HousekeepingTaskChecklistItem.builder()
                        .housekeepingTask(task)
                        .sourceTemplateItemId(item.getId())
                        .titleSnapshot(item.getTitle())
                        .descriptionSnapshot(item.getDescription())
                        .required(item.isRequired())
                        .displayOrder(item.getDisplayOrder())
                        .build())
                .toList();
        taskChecklistItemRepository.saveAll(snapshot);
    }

    private void applyChecklistCompletion(
            List<HousekeepingTaskChecklistItem> checklist,
            List<HousekeepingCleaningItemRequest> requestedItems,
            Employee employee
    ) {
        Map<Long, HousekeepingCleaningItemRequest> requestedById = new LinkedHashMap<>();
        for (HousekeepingCleaningItemRequest requested : requestedItems) {
            if (requestedById.putIfAbsent(requested.taskChecklistItemId(), requested) != null) {
                throw new IllegalArgumentException("Checklist có hạng mục bị trùng");
            }
        }
        Set<Long> validIds = checklist.stream().map(HousekeepingTaskChecklistItem::getId).collect(Collectors.toSet());
        if (!validIds.equals(requestedById.keySet())) {
            throw new IllegalArgumentException("Checklist không đầy đủ hoặc chứa hạng mục không thuộc công việc này");
        }
        List<String> missingRequired = checklist.stream()
                .filter(HousekeepingTaskChecklistItem::isRequired)
                .filter(item -> !requestedById.get(item.getId()).completed())
                .map(HousekeepingTaskChecklistItem::getTitleSnapshot)
                .toList();
        if (!missingRequired.isEmpty()) {
            throw new IllegalArgumentException("Chưa hoàn thành hạng mục bắt buộc: " + String.join(", ", missingRequired));
        }

        LocalDateTime now = LocalDateTime.now();
        checklist.forEach(item -> {
            boolean completed = requestedById.get(item.getId()).completed();
            item.setCompleted(completed);
            item.setCompletedBy(completed ? employee : null);
            item.setCompletedAt(completed ? now : null);
        });
    }

    private HousekeepingTask getTaskEntity(Long taskId) {
        return housekeepingTaskRepository.findByIdForDetail(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy công việc housekeeping"));
    }

    private void requireOwnerOrAdmin(HousekeepingTask task, Employee currentEmployee) {
        Employee assigned = task.getAssignedHousekeeping();
        if (assigned != null && !assigned.getId().equals(currentEmployee.getId()) && !isAdmin()) {
            throw new IllegalArgumentException("Công việc này đang được nhân viên khác thực hiện");
        }
    }

    private boolean isAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
    }

    private Employee getCurrentEmployee() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new IllegalArgumentException("Không xác định được nhân viên đang đăng nhập");
        }
        return employeeRepository.findByAccountEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("Tài khoản hiện tại chưa có hồ sơ nhân viên"));
    }

    private boolean matchesFilter(HousekeepingTask task, String status) {
        return switch (status) {
            case "ALL" -> true;
            case "PENDING" -> "PENDING".equalsIgnoreCase(task.getInspectionStatus());
            case "IN_PROGRESS" -> "IN_PROGRESS".equalsIgnoreCase(task.getInspectionStatus())
                    || ("COMPLETED".equalsIgnoreCase(task.getInspectionStatus())
                    && "IN_PROGRESS".equalsIgnoreCase(task.getCleaningStatus()));
            case "INSPECTED" -> "COMPLETED".equalsIgnoreCase(task.getInspectionStatus())
                    && !"COMPLETED".equalsIgnoreCase(task.getCleaningStatus());
            case "COMPLETED" -> "COMPLETED".equalsIgnoreCase(task.getCleaningStatus());
            default -> false;
        };
    }

    private HousekeepingTaskResponse toResponse(HousekeepingTask task) {
        CheckInRecord record = task.getCheckInRecord();
        BookingDetail detail = record.getBookingDetail();
        Booking booking = detail.getBooking();
        Customer customer = booking.getCustomer();
        Map<Long, Integer> quantities = roomAmenitiesUsageRepository
                .findByBookingDetailIdForAdmin(detail.getId()).stream()
                .collect(Collectors.groupingBy(
                        usage -> usage.getItem().getId(),
                        Collectors.summingInt(RoomAmenitiesUsage::getQuantityUsed)
                ));

        List<HousekeepingMiniBarItemResponse> miniBarItems = roomMiniBarItemRepository.findAll().stream()
                .sorted(Comparator.comparing(RoomMiniBarItem::getName, String.CASE_INSENSITIVE_ORDER))
                .map(item -> {
                    int quantity = quantities.getOrDefault(item.getId(), 0);
                    BigDecimal total = item.getPrice().multiply(BigDecimal.valueOf(quantity));
                    return new HousekeepingMiniBarItemResponse(
                            item.getId(), item.getName(), item.getPrice(), item.getQuantityInStock(), quantity, total
                    );
                })
                .toList();
        BigDecimal totalCharge = miniBarItems.stream()
                .map(HousekeepingMiniBarItemResponse::totalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Set<Long> selectedPenaltyIds = appliedPenaltyRepository.findByBookingDetailIdForAdmin(detail.getId()).stream()
                .map(penalty -> penalty.getRulesPenalty().getId())
                .collect(Collectors.toSet());
        List<HousekeepingPenaltyItemResponse> penaltyItems = rulesPenaltyRepository.findAll().stream()
                .sorted(Comparator.comparing(RulesPenalty::getTitle, String.CASE_INSENSITIVE_ORDER))
                .map(rule -> new HousekeepingPenaltyItemResponse(
                        rule.getId(), rule.getTitle(), rule.getPenaltyAmount(), selectedPenaltyIds.contains(rule.getId())
                ))
                .toList();
        BigDecimal totalPenaltyCharge = penaltyItems.stream()
                .filter(HousekeepingPenaltyItemResponse::selected)
                .map(HousekeepingPenaltyItemResponse::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Employee requestedBy = task.getRequestedBy();
        Employee assigned = task.getAssignedHousekeeping();
        List<HousekeepingCleaningChecklistItemResponse> cleaningChecklistItems = taskChecklistItemRepository
                .findByHousekeepingTaskIdOrderByDisplayOrderAsc(task.getId()).stream()
                .map(item -> new HousekeepingCleaningChecklistItemResponse(
                        item.getId(), item.getTitleSnapshot(), item.getDescriptionSnapshot(), item.isRequired(),
                        item.getDisplayOrder(), item.isCompleted(),
                        item.getCompletedBy() == null ? null : item.getCompletedBy().getId(),
                        item.getCompletedBy() == null ? null : item.getCompletedBy().getFullName(),
                        item.getCompletedAt()
                ))
                .toList();
        return new HousekeepingTaskResponse(
                task.getId(), task.getVersion(), booking.getId(), detail.getId(),
                task.getRoom().getId(), task.getRoom().getRoomNumber(), task.getRoom().getStatus(),
                customer.getFullName(), customer.getPhone(), detail.getCheckOutTarget(),
                task.getInspectionStatus(), task.getCleaningStatus(),
                requestedBy != null ? requestedBy.getId() : null,
                requestedBy != null ? requestedBy.getFullName() : null,
                assigned != null ? assigned.getId() : null,
                assigned != null ? assigned.getFullName() : null,
                task.getNote(), task.getRequestedAt(), task.getStartedAt(),
                task.getInspectionCompletedAt(), task.getCleaningCompletedAt(),
                totalCharge, miniBarItems, totalPenaltyCharge, totalCharge.add(totalPenaltyCharge), penaltyItems,
                cleaningChecklistItems
        );
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
