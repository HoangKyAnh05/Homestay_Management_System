package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.request.FixedFundConfigRequest;
import com.homestayManagement.homestayManagement.dto.request.ResolveCompensationRequest;
import com.homestayManagement.homestayManagement.dto.request.ShiftHandoverRequest;
import com.homestayManagement.homestayManagement.dto.response.*;
import com.homestayManagement.homestayManagement.entity.*;
import com.homestayManagement.homestayManagement.repository.*;
import com.homestayManagement.homestayManagement.service.ShiftHandoverService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ShiftHandoverServiceImpl implements ShiftHandoverService {

    private static final BigDecimal DEFAULT_INITIAL_CASH = BigDecimal.valueOf(1000000); // 1.000.000 VNĐ quỹ dự phòng ban đầu

    private final ShiftHandoverRepository shiftHandoverRepository;
    private final AccountRepository accountRepository;
    private final EmployeeRepository employeeRepository;
    private final PaymentRepository paymentRepository;
    private final PasswordEncoder passwordEncoder;
    private final FixedFundConfigRepository fixedFundConfigRepository;
    private final FundAdjustmentLogRepository fundAdjustmentLogRepository;

    @Override
    @Transactional(readOnly = true)
    public ShiftCurrentStatusResponse getCurrentStatus(String currentUsername) {
        Employee currentEmployee = employeeRepository.findByAccountEmail(currentUsername).orElse(null);
        ReceptionistStaffResponse staffDto = null;
        if (currentEmployee != null) {
            staffDto = new ReceptionistStaffResponse(
                    currentEmployee.getId(),
                    currentEmployee.getAccount() != null ? currentEmployee.getAccount().getId() : null,
                    currentEmployee.getFullName(),
                    currentEmployee.getAccount() != null ? currentEmployee.getAccount().getEmail() : currentUsername,
                    currentEmployee.getPhone(),
                    currentEmployee.getAvatarUrl()
            );
        }

        Optional<ShiftHandover> activeShiftOpt = shiftHandoverRepository.findFirstByStatusOrderByHandoverTimeDesc("ACTIVE");
        Optional<ShiftHandover> lastHandoverOpt = shiftHandoverRepository.findFirstByOrderByHandoverTimeDesc();

        boolean hasActiveShift = activeShiftOpt.isPresent();
        ShiftHandover activeShift = activeShiftOpt.orElse(null);
        ShiftHandover lastHandover = lastHandoverOpt.orElse(null);

        boolean isCurrentStaffInShift = false;
        if (activeShift != null && currentEmployee != null && activeShift.getIncomingStaff() != null) {
            isCurrentStaffInShift = activeShift.getIncomingStaff().getId().equals(currentEmployee.getId());
        }

        FixedFundConfig fundConfig = getOrCreateDefaultFundConfig();
        BigDecimal initialCash;
        LocalDateTime startTime;

        if (activeShift != null) {
            // Nhân viên trong ca nhận toàn bộ số tiền thực tế bàn giao từ ca trước (gồm quỹ đầu ca + doanh thu ca trước)
            initialCash = activeShift.getActualCash() != null ? activeShift.getActualCash() : activeShift.getInitialCash();
            startTime = activeShift.getHandoverTime();
        } else if (lastHandover != null) {
            initialCash = lastHandover.getActualCash() != null ? lastHandover.getActualCash() : fundConfig.getFundAmount();
            startTime = lastHandover.getHandoverTime();
        } else {
            initialCash = fundConfig.getFundAmount();
            startTime = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);
        }

        BigDecimal cashRevenueInShift = paymentRepository.sumCashPaymentsBetween(startTime, LocalDateTime.now());
        if (cashRevenueInShift == null) {
            cashRevenueInShift = BigDecimal.ZERO;
        }

        BigDecimal expectedCash = initialCash.add(cashRevenueInShift);

        return new ShiftCurrentStatusResponse(
                hasActiveShift,
                isCurrentStaffInShift,
                activeShift != null ? mapToResponse(activeShift) : null,
                lastHandover != null ? mapToResponse(lastHandover) : null,
                initialCash,
                cashRevenueInShift,
                expectedCash,
                staffDto
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReceptionistStaffResponse> getReceptionistStaffList(String currentUsername) {
        // CHỈ lấy nhân viên có vai trò Lễ tân (ROLE_RECEPTIONIST), KHÔNG lấy tài khoản Admin
        List<Employee> receptionists = employeeRepository.findActiveEmployeesByRole("ROLE_RECEPTIONIST");

        // Loại trừ tài khoản của nhân viên hiện tại để đảm bảo người giao và người nhận là 2 nick khác nhau
        return receptionists.stream()
                .filter(e -> e.getAccount() != null && !e.getAccount().getEmail().equalsIgnoreCase(currentUsername))
                .map(e -> new ReceptionistStaffResponse(
                        e.getId(),
                        e.getAccount().getId(),
                        e.getFullName(),
                        e.getAccount().getEmail(),
                        e.getPhone(),
                        e.getAvatarUrl()
                ))
                .toList();
    }

    @Override
    @Transactional
    public ShiftHandoverResponse handoverShift(ShiftHandoverRequest request, String currentUsername) {
        Account incomingAccount = accountRepository.findByEmail(currentUsername)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài khoản nhân viên nhận ca: " + currentUsername));
        Employee incomingStaff = employeeRepository.findByAccountId(incomingAccount.getId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thông tin hồ sơ nhân viên nhận ca"));

        String outgoingEmail = request.outgoingEmail().trim();
        Account outgoingAccount = accountRepository.findByEmail(outgoingEmail)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài khoản nhân viên giao ca: " + outgoingEmail));
        Employee outgoingStaff = employeeRepository.findByAccountId(outgoingAccount.getId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thông tin hồ sơ nhân viên giao ca"));

        // RÀNG BUỘC: Không được giao ca với Admin - cả người giao và người nhận phải là Lễ tân
        if (outgoingAccount.getRole() == null || !"ROLE_RECEPTIONIST".equalsIgnoreCase(outgoingAccount.getRole().getName())) {
            throw new IllegalArgumentException("Không được giao ca với tài khoản Quản trị viên (Admin). Người giao ca bắt buộc phải là nhân viên Lễ tân!");
        }

        // 1. RÀNG BUỘC: Người trước và người sau phải là 2 nick khác nhau
        if (incomingAccount.getId().equals(outgoingAccount.getId())
                || incomingAccount.getEmail().equalsIgnoreCase(outgoingAccount.getEmail())) {
            throw new IllegalArgumentException("Người giao ca và người nhận ca phải là 2 tài khoản khác nhau!");
        }

        // 2. RÀNG BUỘC: Xác thực mật khẩu của người giao ca (người ca trước)
        if (!passwordEncoder.matches(request.outgoingPassword(), outgoingAccount.getPassword())) {
            throw new IllegalArgumentException("Mật khẩu xác nhận của nhân viên giao ca (" + outgoingStaff.getFullName() + ") không chính xác!");
        }

        // 3. RÀNG BUỘC: Kiểm tra đối soát tiền (Đủ hoặc Thiếu)
        boolean isSufficient = Boolean.TRUE.equals(request.isSufficient());
        String cashStatus = isSufficient ? "ENOUGH" : "SHORTAGE";
        BigDecimal shortageAmount = null;
        String shortageReason = null;
        LocalDateTime compensationDeadline = null;
        String compensationStatus = "NONE";

        if (!isSufficient) {
            if (request.shortageAmount() == null || request.shortageAmount().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Vui lòng nhập số tiền thiếu lớn hơn 0");
            }
            if (request.shortageReason() == null || request.shortageReason().trim().isEmpty()) {
                throw new IllegalArgumentException("Vui lòng nhập lý do thiếu tiền");
            }
            if (request.compensationDeadline() == null) {
                throw new IllegalArgumentException("Vui lòng chọn thời hạn bù tiền");
            }
            shortageAmount = request.shortageAmount();
            shortageReason = request.shortageReason().trim();
            compensationDeadline = request.compensationDeadline();
            compensationStatus = "PENDING";
        }

        // 4. Tính toán tiền quỹ và doanh thu tiền mặt hệ thống
        Optional<ShiftHandover> activeShiftOpt = shiftHandoverRepository.findFirstByStatusOrderByHandoverTimeDesc("ACTIVE");
        Optional<ShiftHandover> lastHandoverOpt = shiftHandoverRepository.findFirstByOrderByHandoverTimeDesc();

        FixedFundConfig fundConfig = getOrCreateDefaultFundConfig();
        BigDecimal initialCash;
        LocalDateTime fromTime;

        if (activeShiftOpt.isPresent()) {
            ShiftHandover activeShift = activeShiftOpt.get();
            // Tiền đầu ca của nhân viên giao ca chính là số tiền họ đã nhận bàn giao từ trước
            initialCash = activeShift.getActualCash() != null ? activeShift.getActualCash() : activeShift.getInitialCash();
            fromTime = activeShift.getHandoverTime();

            // Đóng ca trước
            activeShift.setStatus("HANDED_OVER");
            shiftHandoverRepository.save(activeShift);
        } else if (lastHandoverOpt.isPresent()) {
            ShiftHandover last = lastHandoverOpt.get();
            initialCash = last.getActualCash() != null ? last.getActualCash() : fundConfig.getFundAmount();
            fromTime = last.getHandoverTime();
        } else {
            initialCash = fundConfig.getFundAmount();
            fromTime = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);
        }

        BigDecimal cashRevenue = paymentRepository.sumCashPaymentsBetween(fromTime, LocalDateTime.now());
        if (cashRevenue == null) {
            cashRevenue = BigDecimal.ZERO;
        }
        BigDecimal systemCash = initialCash.add(cashRevenue);

        // RÀNG BUỘC: Số tiền thiếu phải nhỏ hơn hoặc bằng số tiền chuyển giao ca (systemCash)
        if (!isSufficient && shortageAmount != null) {
            if (shortageAmount.compareTo(systemCash) > 0) {
                throw new IllegalArgumentException("Số tiền thiếu (" + shortageAmount.toPlainString() + " VNĐ) không được lớn hơn tổng số tiền của ca chuyển giao (" + systemCash.toPlainString() + " VNĐ)!");
            }
        }

        // 5. Lưu bản ghi giao ca mới
        ShiftHandover newShift = ShiftHandover.builder()
                .outgoingStaff(outgoingStaff)
                .incomingStaff(incomingStaff)
                .handoverTime(LocalDateTime.now())
                .initialCash(initialCash)
                .systemCash(systemCash)
                .actualCash(request.actualCash())
                .cashStatus(cashStatus)
                .shortageAmount(shortageAmount)
                .shortageReason(shortageReason)
                .compensationDeadline(compensationDeadline)
                .compensationStatus(compensationStatus)
                .status("ACTIVE")
                .notes(request.notes())
                .build();

        ShiftHandover saved = shiftHandoverRepository.save(newShift);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ShiftHandoverResponse> getShiftHistory(
            String status,
            String cashStatus,
            String compensationStatus,
            LocalDateTime fromDate,
            LocalDateTime toDate,
            Pageable pageable
    ) {
        return shiftHandoverRepository.searchHistory(
                status,
                cashStatus,
                compensationStatus,
                fromDate,
                toDate,
                pageable
        ).map(this::mapToResponse);
    }

    @Override
    @Transactional
    public ShiftHandoverResponse resolveCompensation(Long id, ResolveCompensationRequest request, String currentUsername) {
        ShiftHandover shift = shiftHandoverRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy biên bản giao ca với mã: " + id));

        if (!"PENDING".equalsIgnoreCase(shift.getCompensationStatus())) {
            throw new IllegalArgumentException("Biên bản giao ca này không trong trạng thái chờ bù tiền");
        }

        shift.setCompensationStatus("RESOLVED");
        shift.setCompensationResolvedAt(LocalDateTime.now());
        if (request != null && request.notes() != null && !request.notes().trim().isEmpty()) {
            String note = (shift.getCompensationNotes() != null ? shift.getCompensationNotes() + "; " : "") + request.notes().trim();
            shift.setCompensationNotes(note);
        }

        ShiftHandover updated = shiftHandoverRepository.save(shift);
        return mapToResponse(updated);
    }

    private ShiftHandoverResponse mapToResponse(ShiftHandover s) {
        Employee out = s.getOutgoingStaff();
        Employee in = s.getIncomingStaff();

        return new ShiftHandoverResponse(
                s.getId(),
                out != null ? out.getId() : null,
                out != null ? out.getFullName() : null,
                out != null && out.getAccount() != null ? out.getAccount().getEmail() : null,
                out != null ? out.getPhone() : null,
                in != null ? in.getId() : null,
                in != null ? in.getFullName() : null,
                in != null && in.getAccount() != null ? in.getAccount().getEmail() : null,
                in != null ? in.getPhone() : null,
                s.getHandoverTime(),
                s.getInitialCash(),
                s.getSystemCash(),
                s.getActualCash(),
                s.getCashStatus(),
                s.getShortageAmount(),
                s.getShortageReason(),
                s.getCompensationDeadline(),
                s.getCompensationStatus(),
                s.getCompensationNotes(),
                s.getCompensationResolvedAt(),
                s.getStatus(),
                s.getNotes(),
                s.getCreatedAt()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public FixedFundConfigResponse getFixedFundConfig() {
        FixedFundConfig config = getOrCreateDefaultFundConfig();
        List<FundAdjustmentLogResponse> logResponses = fundAdjustmentLogRepository.findTop50ByOrderByAdjustedAtDesc().stream()
                .map(l -> new FundAdjustmentLogResponse(
                        l.getId(),
                        l.getOldAmount(),
                        l.getNewAmount(),
                        l.getOldMode(),
                        l.getNewMode(),
                        l.getReason(),
                        l.getAdjustedBy() != null ? l.getAdjustedBy().getFullName() : "Admin",
                        l.getAdjustedAt()
                ))
                .toList();

        return new FixedFundConfigResponse(
                config.getId(),
                config.getFundAmount(),
                config.getFundMode(),
                config.getDescription(),
                config.getUpdatedBy() != null ? config.getUpdatedBy().getFullName() : "Admin",
                config.getUpdatedAt(),
                logResponses
        );
    }

    @Override
    @Transactional
    public FixedFundConfigResponse updateFixedFundConfig(FixedFundConfigRequest request, String currentUsername) {
        Employee admin = employeeRepository.findByAccountEmail(currentUsername).orElse(null);
        FixedFundConfig config = getOrCreateDefaultFundConfig();

        BigDecimal oldAmount = config.getFundAmount();
        String oldMode = config.getFundMode();

        BigDecimal newAmount = request.fundAmount();
        String newMode = request.fundMode() != null ? request.fundMode().trim().toUpperCase() : "FIXED";

        config.setFundAmount(newAmount);
        config.setFundMode(newMode);
        config.setDescription(request.description());
        config.setUpdatedBy(admin);
        config.setUpdatedAt(LocalDateTime.now());
        fixedFundConfigRepository.save(config);

        // Lưu log điều chỉnh quỹ
        FundAdjustmentLog log = FundAdjustmentLog.builder()
                .oldAmount(oldAmount)
                .newAmount(newAmount)
                .oldMode(oldMode)
                .newMode(newMode)
                .reason(request.reason() != null && !request.reason().trim().isEmpty() ? request.reason().trim() : "Admin điều chỉnh quỹ quầy lễ tân")
                .adjustedBy(admin)
                .adjustedAt(LocalDateTime.now())
                .build();
        fundAdjustmentLogRepository.save(log);

        return getFixedFundConfig();
    }

    private FixedFundConfig getOrCreateDefaultFundConfig() {
        FixedFundConfig defaultConfig = FixedFundConfig.builder()
                .fundAmount(DEFAULT_INITIAL_CASH)
                .fundMode("ACCUMULATIVE")
                .description("Quỹ tiền mặt quầy lễ tân - Kế thừa thực tế toàn bộ tiền giữa các ca làm")
                .updatedAt(LocalDateTime.now())
                .build();

        if (fixedFundConfigRepository == null) {
            return defaultConfig;
        }
        try {
            FixedFundConfig found = fixedFundConfigRepository.findAll().stream().findFirst().orElse(null);
            if (found != null) {
                // Tự động chuyển sang ACCUMULATIVE nếu đang là FIXED để ca sau nhận full tiền ca trước
                if ("FIXED".equalsIgnoreCase(found.getFundMode())) {
                    found.setFundMode("ACCUMULATIVE");
                    found.setDescription("Quỹ tiền mặt quầy lễ tân - Kế thừa thực tế toàn bộ tiền giữa các ca làm");
                    fixedFundConfigRepository.save(found);
                }
                return found;
            }
            FixedFundConfig saved = fixedFundConfigRepository.save(defaultConfig);
            return saved != null ? saved : defaultConfig;
        } catch (Exception e) {
            return defaultConfig;
        }
    }
}
