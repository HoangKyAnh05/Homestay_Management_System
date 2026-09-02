package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.request.RoomIncidentCompensationRequest;
import com.homestayManagement.homestayManagement.dto.request.RoomIncidentCreateRequest;
import com.homestayManagement.homestayManagement.dto.request.RoomIncidentStatusUpdateRequest;
import com.homestayManagement.homestayManagement.dto.response.RoomIncidentResponse;
import com.homestayManagement.homestayManagement.dto.response.RoomIncidentSummaryResponse;
import com.homestayManagement.homestayManagement.entity.*;
import com.homestayManagement.homestayManagement.repository.*;
import com.homestayManagement.homestayManagement.service.AdminBookingService;
import com.homestayManagement.homestayManagement.service.RoomIncidentService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

@Service
public class RoomIncidentServiceImpl implements RoomIncidentService {

    private static final Set<String> VALID_STATUSES = Set.of(
            "REPORTED", "IN_PROGRESS", "RESOLVED", "DISMISSED"
    );

    private static final Set<String> VALID_TYPES = Set.of(
            "DAMAGED", "LOST", "MAINTENANCE"
    );

    private static final Path UPLOAD_DIR = Paths.get("uploads");
    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of("image/jpeg", "image/png", "image/webp", "image/jpg");

    private static final Set<String> VALID_SEVERITIES = Set.of(
            "LOW", "MEDIUM", "HIGH", "CRITICAL"
    );

    private static final Set<String> VALID_LIABILITIES = Set.of(
            "CUSTOMER", "HOMESTAY", "NONE"
    );

    private final RoomIncidentRepository roomIncidentRepository;
    private final RoomRepository roomRepository;
    private final BookingDetailRepository bookingDetailRepository;
    private final HousekeepingTaskRepository housekeepingTaskRepository;
    private final CheckInRecordRepository checkInRecordRepository;
    private final EmployeeRepository employeeRepository;
    private final RulesPenaltyRepository rulesPenaltyRepository;
    private final AppliedPenaltyRepository appliedPenaltyRepository;
    private final AdminBookingService adminBookingService;

    public RoomIncidentServiceImpl(
            RoomIncidentRepository roomIncidentRepository,
            RoomRepository roomRepository,
            BookingDetailRepository bookingDetailRepository,
            HousekeepingTaskRepository housekeepingTaskRepository,
            CheckInRecordRepository checkInRecordRepository,
            EmployeeRepository employeeRepository,
            RulesPenaltyRepository rulesPenaltyRepository,
            AppliedPenaltyRepository appliedPenaltyRepository,
            AdminBookingService adminBookingService
    ) {
        this.roomIncidentRepository = roomIncidentRepository;
        this.roomRepository = roomRepository;
        this.bookingDetailRepository = bookingDetailRepository;
        this.housekeepingTaskRepository = housekeepingTaskRepository;
        this.checkInRecordRepository = checkInRecordRepository;
        this.employeeRepository = employeeRepository;
        this.rulesPenaltyRepository = rulesPenaltyRepository;
        this.appliedPenaltyRepository = appliedPenaltyRepository;
        this.adminBookingService = adminBookingService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoomIncidentResponse> getIncidents(String status, String type, Long roomId) {
        List<RoomIncident> incidents;
        if (roomId != null && roomId > 0) {
            incidents = roomIncidentRepository.findByRoomIdWithDetails(roomId);
        } else {
            incidents = roomIncidentRepository.findAllWithDetails();
        }

        String normalizedStatus = status != null ? status.trim().toUpperCase() : "ALL";
        String normalizedType = type != null ? type.trim().toUpperCase() : "ALL";

        // Tự động đồng bộ phòng sang MAINTENANCE nếu đang có sự cố IN_PROGRESS
        incidents.stream()
                .filter(i -> "IN_PROGRESS".equals(i.getStatus()))
                .map(RoomIncident::getRoom)
                .filter(r -> r != null && !"MAINTENANCE".equalsIgnoreCase(r.getStatus()))
                .distinct()
                .forEach(r -> {
                    r.setStatus("MAINTENANCE");
                    roomRepository.save(r);
                });

        return incidents.stream()
                .filter(i -> "ALL".equals(normalizedStatus) || normalizedStatus.equalsIgnoreCase(i.getStatus()))
                .filter(i -> "ALL".equals(normalizedType) || normalizedType.equalsIgnoreCase(i.getIncidentType()))
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public RoomIncidentResponse getIncident(Long id) {
        RoomIncident incident = roomIncidentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy báo cáo sự cố #" + id));
        return toResponse(incident);
    }

    @Override
    @Transactional(readOnly = true)
    public RoomIncidentSummaryResponse getIncidentSummary() {
        List<RoomIncident> all = roomIncidentRepository.findAll();
        long total = all.size();
        long reported = all.stream().filter(i -> "REPORTED".equalsIgnoreCase(i.getStatus())).count();
        long inProgress = all.stream().filter(i -> "IN_PROGRESS".equalsIgnoreCase(i.getStatus())).count();
        long resolved = all.stream().filter(i -> "RESOLVED".equalsIgnoreCase(i.getStatus())).count();
        long damaged = all.stream().filter(i -> "DAMAGED".equalsIgnoreCase(i.getIncidentType())).count();
        long lost = all.stream().filter(i -> "LOST".equalsIgnoreCase(i.getIncidentType())).count();
        long maintenance = all.stream().filter(i -> "MAINTENANCE".equalsIgnoreCase(i.getIncidentType())).count();
        BigDecimal totalCompensation = all.stream()
                .map(RoomIncident::getCompensationAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new RoomIncidentSummaryResponse(total, reported, inProgress, resolved, damaged, lost, maintenance, totalCompensation);
    }

    @Override
    @Transactional
    public RoomIncidentResponse reportIncident(RoomIncidentCreateRequest request) {
        Room room = roomRepository.findById(request.roomId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phòng #" + request.roomId()));

        String incidentType = request.incidentType().trim().toUpperCase();
        if (!VALID_TYPES.contains(incidentType)) {
            throw new IllegalArgumentException("Loại sự cố không hợp lệ (chỉ chấp nhận DAMAGED, LOST hoặc MAINTENANCE)");
        }

        String severity = request.severity() != null ? request.severity().trim().toUpperCase() : "MEDIUM";
        if (!VALID_SEVERITIES.contains(severity)) {
            severity = "MEDIUM";
        }

        BookingDetail bookingDetail = null;
        if (request.bookingDetailId() != null) {
            bookingDetail = bookingDetailRepository.findById(request.bookingDetailId()).orElse(null);
        }

        HousekeepingTask task = null;
        if (request.housekeepingTaskId() != null) {
            task = housekeepingTaskRepository.findById(request.housekeepingTaskId()).orElse(null);
            if (bookingDetail == null && task != null && task.getCheckInRecord() != null) {
                bookingDetail = task.getCheckInRecord().getBookingDetail();
            }
        }

        Employee reporter = getCurrentEmployee();

        RoomIncident incident = RoomIncident.builder()
                .room(room)
                .bookingDetail(bookingDetail)
                .housekeepingTask(task)
                .reportedBy(reporter)
                .itemName(request.itemName().trim())
                .quantity(request.quantity() != null && request.quantity() > 0 ? request.quantity() : 1)
                .incidentType(incidentType)
                .severity(severity)
                .description(request.description())
                .evidenceImageUrl(request.evidenceImageUrl())
                .estimatedCost(request.estimatedCost())
                .status("REPORTED")
                .reportedAt(LocalDateTime.now())
                .build();

        RoomIncident saved = roomIncidentRepository.save(incident);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public RoomIncidentResponse updateStatus(Long id, RoomIncidentStatusUpdateRequest request) {
        RoomIncident incident = roomIncidentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy báo cáo sự cố #" + id));

        String newStatus = request.status().trim().toUpperCase();
        if (!VALID_STATUSES.contains(newStatus)) {
            throw new IllegalArgumentException("Trạng thái không hợp lệ");
        }

        incident.setStatus(newStatus);
        incident.setHandledBy(getCurrentEmployee());
        if ("RESOLVED".equals(newStatus) && incident.getResolvedAt() == null) {
            incident.setResolvedAt(LocalDateTime.now());
        }

        if (request.adminNotes() != null && !request.adminNotes().isBlank()) {
            incident.setAdminNotes(request.adminNotes().trim());
        }

        Room room = incident.getRoom();
        if (room != null) {
            if ("IN_PROGRESS".equals(newStatus)) {
                room.setStatus("MAINTENANCE");
                roomRepository.save(room);
            } else if ("RESOLVED".equals(newStatus) || "DISMISSED".equals(newStatus)) {
                long remainingInProgress = roomIncidentRepository.findAll().stream()
                        .filter(other -> !other.getId().equals(incident.getId()))
                        .filter(other -> other.getRoom() != null && other.getRoom().getId().equals(room.getId()))
                        .filter(other -> "IN_PROGRESS".equals(other.getStatus()))
                        .count();
                if (remainingInProgress == 0 && "MAINTENANCE".equalsIgnoreCase(room.getStatus())) {
                    room.setStatus("AVAILABLE");
                    roomRepository.save(room);
                }
            }
        }

        RoomIncident saved = roomIncidentRepository.save(incident);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public RoomIncidentResponse decideCompensation(Long id, RoomIncidentCompensationRequest request) {
        RoomIncident incident = roomIncidentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy báo cáo sự cố #" + id));

        String liability = request.liability().trim().toUpperCase();
        if (!VALID_LIABILITIES.contains(liability)) {
            throw new IllegalArgumentException("Bên chịu trách nhiệm không hợp lệ (CUSTOMER, HOMESTAY, NONE)");
        }

        incident.setLiability(liability);
        incident.setCompensationAmount(request.compensationAmount() != null ? request.compensationAmount() : BigDecimal.ZERO);
        incident.setHandledBy(getCurrentEmployee());
        if (request.adminNotes() != null && !request.adminNotes().isBlank()) {
            incident.setAdminNotes(request.adminNotes().trim());
        }

        // Tự động ghi nhận phụ phí phạt vào hóa đơn booking nếu khách bồi thường và chargeToInvoice = true
        if ("CUSTOMER".equals(liability) && Boolean.TRUE.equals(request.chargeToInvoice())
                && incident.getBookingDetail() != null
                && request.compensationAmount() != null
                && request.compensationAmount().compareTo(BigDecimal.ZERO) > 0) {

            CheckInRecord record = checkInRecordRepository.findByBookingDetailId(incident.getBookingDetail().getId())
                    .orElse(null);

            if (record != null) {
                RulesPenalty penaltyRule = rulesPenaltyRepository.findAll().stream().findFirst().orElse(null);
                if (penaltyRule != null) {
                    String typeName = "LOST".equals(incident.getIncidentType()) ? "Mất đồ"
                            : ("MAINTENANCE".equals(incident.getIncidentType()) ? "Bảo trì" : "Hỏng hóc");
                    String fineDescription = "Bồi thường: " + incident.getItemName() + " (" + typeName + ")";

                    AppliedPenalty penalty = AppliedPenalty.builder()
                            .checkRecord(record)
                            .rulesPenalty(penaltyRule)
                            .actualFine(request.compensationAmount())
                            .description(fineDescription)
                            .build();

                    appliedPenaltyRepository.save(penalty);
                    try {
                        adminBookingService.generateInvoice(incident.getBookingDetail().getId());
                    } catch (Exception ignored) {
                        // Bỏ qua nếu chưa thể sinh lại hóa đơn ngay
                    }
                }
            }
        }

        RoomIncident saved = roomIncidentRepository.save(incident);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public void deleteIncident(Long id) {
        RoomIncident incident = roomIncidentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy báo cáo sự cố #" + id));
        roomIncidentRepository.delete(incident);
    }

    @Override
    public String uploadEvidenceImage(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File ảnh không hợp lệ hoặc đang trống");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("Chỉ chấp nhận file ảnh JPG, PNG, WEBP");
        }
        Files.createDirectories(UPLOAD_DIR);
        String originalName = file.getOriginalFilename();
        String ext = (originalName != null && originalName.contains("."))
                ? originalName.substring(originalName.lastIndexOf("."))
                : ".jpg";
        String filename = "incident-" + UUID.randomUUID() + ext;
        Path target = UPLOAD_DIR.resolve(filename).normalize();
        file.transferTo(target);
        return "/uploads/" + filename;
    }

    private Employee getCurrentEmployee() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            return employeeRepository.findAll().stream().findFirst()
                    .orElseThrow(() -> new IllegalStateException("Hệ thống chưa có nhân viên nào"));
        }
        return employeeRepository.findByAccountEmail(auth.getName())
                .orElseGet(() -> employeeRepository.findAll().stream().findFirst()
                        .orElseThrow(() -> new IllegalStateException("Không xác định được nhân viên báo cáo")));
    }

    private RoomIncidentResponse toResponse(RoomIncident i) {
        Room room = i.getRoom();
        BookingDetail detail = i.getBookingDetail();
        Booking booking = detail != null ? detail.getBooking() : null;
        Customer customer = booking != null ? booking.getCustomer() : null;
        Employee reporter = i.getReportedBy();
        Employee handler = i.getHandledBy();

        return new RoomIncidentResponse(
                i.getId(),
                room != null ? room.getId() : null,
                room != null ? room.getRoomNumber() : "—",
                room != null && room.getRoomType() != null ? room.getRoomType().getName() : "—",
                detail != null ? detail.getId() : null,
                booking != null ? booking.getBookingCode() : null,
                customer != null ? customer.getFullName() : null,
                customer != null ? customer.getPhone() : null,
                i.getHousekeepingTask() != null ? i.getHousekeepingTask().getId() : null,
                reporter != null ? reporter.getId() : null,
                reporter != null ? reporter.getFullName() : "—",
                handler != null ? handler.getId() : null,
                handler != null ? handler.getFullName() : null,
                i.getItemName(),
                i.getQuantity(),
                i.getIncidentType(),
                i.getSeverity(),
                i.getDescription(),
                i.getEvidenceImageUrl(),
                i.getStatus(),
                i.getLiability(),
                i.getEstimatedCost(),
                i.getCompensationAmount(),
                i.getAdminNotes(),
                i.getReportedAt(),
                i.getResolvedAt()
        );
    }
}
