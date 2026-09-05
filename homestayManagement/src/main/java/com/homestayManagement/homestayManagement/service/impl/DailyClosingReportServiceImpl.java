package com.homestayManagement.homestayManagement.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.homestayManagement.homestayManagement.dto.dailyreport.*;
import com.homestayManagement.homestayManagement.entity.*;
import com.homestayManagement.homestayManagement.repository.*;
import com.homestayManagement.homestayManagement.service.DailyClosingReportService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class DailyClosingReportServiceImpl implements DailyClosingReportService {

    private final DailyClosingReportRepository dailyClosingReportRepository;
    private final CheckInRecordRepository checkInRecordRepository;
    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final EmployeeRepository employeeRepository;
    private final ObjectMapper objectMapper;

    public DailyClosingReportServiceImpl(
            DailyClosingReportRepository dailyClosingReportRepository,
            CheckInRecordRepository checkInRecordRepository,
            PaymentRepository paymentRepository,
            InvoiceRepository invoiceRepository,
            EmployeeRepository employeeRepository,
            ObjectMapper objectMapper
    ) {
        this.dailyClosingReportRepository = dailyClosingReportRepository;
        this.checkInRecordRepository = checkInRecordRepository;
        this.paymentRepository = paymentRepository;
        this.invoiceRepository = invoiceRepository;
        this.employeeRepository = employeeRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public DailyReportPreviewResponse getPreview(LocalDate date) {
        LocalDate targetDate = (date != null) ? date : LocalDate.now();
        LocalDateTime startInclusive = targetDate.atStartOfDay();
        LocalDateTime endExclusive = targetDate.plusDays(1).atStartOfDay();

        // 1. Tính doanh thu
        BigDecimal cash = paymentRepository.sumCashPaymentsBetween(startInclusive, endExclusive);
        if (cash == null) cash = BigDecimal.ZERO;

        BigDecimal transfer = paymentRepository.sumNonCashPaymentsBetween(startInclusive, endExclusive);
        if (transfer == null) transfer = BigDecimal.ZERO;

        BigDecimal total = cash.add(transfer);

        // Nếu bảng payments chưa có bản ghi, thử tính từ bảng invoices tạo trong ngày
        if (total.compareTo(BigDecimal.ZERO) == 0) {
            List<Invoice> invoices = invoiceRepository.findByCreatedAtRangeForDashboard(startInclusive, endExclusive);
            BigDecimal invTotal = invoices.stream()
                    .map(inv -> inv.getTotalAmount() != null ? inv.getTotalAmount() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            if (invTotal.compareTo(BigDecimal.ZERO) > 0) {
                total = invTotal;
                transfer = invTotal;
            }
        }

        // Lấy danh sách giao dịch thanh toán trong ngày
        List<Payment> paymentList = paymentRepository.findSuccessfulPaymentsBetween(startInclusive, endExclusive);
        List<DailyInvoiceItemDto> invoiceDtos = new ArrayList<>();
        for (Payment p : paymentList) {
            String bCode = (p.getInvoice() != null && p.getInvoice().getBooking() != null)
                    ? p.getInvoice().getBooking().getBookingCode()
                    : "—";
            String cName = (p.getInvoice() != null && p.getInvoice().getBooking() != null && p.getInvoice().getBooking().getCustomer() != null)
                    ? p.getInvoice().getBooking().getCustomer().getFullName()
                    : "Khách lẻ";
            invoiceDtos.add(DailyInvoiceItemDto.builder()
                    .invoiceId(p.getInvoice() != null ? p.getInvoice().getId() : p.getId())
                    .bookingCode(bCode)
                    .customerName(cName)
                    .amount(p.getAmount())
                    .paymentMethod(p.getPaymentMethod())
                    .createdAt(p.getPaymentTime() != null ? p.getPaymentTime() : startInclusive)
                    .build());
        }

        // 2. Danh sách phòng đang có khách ở
        List<CheckInRecord> occupiedRecords = checkInRecordRepository.findCurrentlyOccupied();
        List<OccupiedRoomItemDto> occupiedRooms = new ArrayList<>();
        for (CheckInRecord cr : occupiedRecords) {
            BookingDetail bd = cr.getBookingDetail();
            Booking b = (bd != null) ? bd.getBooking() : null;
            Room r = (bd != null) ? bd.getRoom() : null;
            RoomType rt = (bd != null) ? bd.getRoomType() : null;
            if (rt == null && r != null) rt = r.getRoomType();
            Customer c = cr.getCustomer();
            if (c == null && b != null) c = b.getCustomer();

            int guests = 1;
            if (bd != null) {
                int adults = bd.getNumberOfAdults() != null ? bd.getNumberOfAdults() : 1;
                int children = bd.getNumberOfChildren() != null ? bd.getNumberOfChildren() : 0;
                guests = adults + children;
            }

            occupiedRooms.add(OccupiedRoomItemDto.builder()
                    .roomId(r != null ? r.getId() : null)
                    .roomNumber(r != null ? r.getRoomNumber() : "—")
                    .roomTypeName(rt != null ? rt.getName() : "Tiêu chuẩn")
                    .customerName(c != null ? c.getFullName() : "—")
                    .customerPhone(c != null ? c.getPhone() : "—")
                    .bookingCode(b != null ? b.getBookingCode() : "—")
                    .actualCheckIn(cr.getActualCheckIn())
                    .expectedCheckOut(bd != null ? bd.getCheckOutTarget() : null)
                    .guestCount(guests)
                    .build());
        }

        // 3. Số lượt check-in và check-out hôm nay
        int checkIns = checkInRecordRepository.countCheckInBetween(startInclusive, endExclusive);
        int checkOuts = checkInRecordRepository.countCheckOutBetween(startInclusive, endExclusive);

        // 4. Kiểm tra đã có báo cáo cho ngày này chưa
        Optional<DailyClosingReport> existingOpt = dailyClosingReportRepository.findFirstByReportDateOrderByCreatedAtDesc(targetDate);

        return DailyReportPreviewResponse.builder()
                .reportDate(targetDate)
                .occupiedRoomsCount(occupiedRooms.size())
                .checkInTodayCount(checkIns)
                .checkOutTodayCount(checkOuts)
                .cashRevenue(cash)
                .transferRevenue(transfer)
                .totalRevenue(total)
                .occupiedRooms(occupiedRooms)
                .invoices(invoiceDtos)
                .alreadySubmitted(existingOpt.isPresent())
                .existingReportId(existingOpt.map(DailyClosingReport::getId).orElse(null))
                .existingReportStatus(existingOpt.map(DailyClosingReport::getStatus).orElse(null))
                .build();
    }

    @Override
    @Transactional
    public DailyReportResponse createReport(DailyReportCreateRequest request, String currentUsername) {
        if (request.getReportDate() == null) {
            request.setReportDate(LocalDate.now());
        }

        Employee staff = null;
        String fullName = "Nhân viên trực";
        if (currentUsername != null && !currentUsername.isBlank()) {
            staff = employeeRepository.findByAccountEmail(currentUsername).orElse(null);
            if (staff != null) {
                fullName = staff.getFullName();
            }
        }

        DailyClosingReport report = DailyClosingReport.builder()
                .reportDate(request.getReportDate())
                .staff(staff)
                .staffUsername(currentUsername)
                .staffFullName(fullName)
                .createdAt(LocalDateTime.now())
                .totalRevenue(request.getTotalRevenue() != null ? request.getTotalRevenue() : BigDecimal.ZERO)
                .cashRevenue(request.getCashRevenue() != null ? request.getCashRevenue() : BigDecimal.ZERO)
                .transferRevenue(request.getTransferRevenue() != null ? request.getTransferRevenue() : BigDecimal.ZERO)
                .occupiedRoomsCount(request.getOccupiedRoomsCount() != null ? request.getOccupiedRoomsCount() : 0)
                .checkInTodayCount(request.getCheckInTodayCount() != null ? request.getCheckInTodayCount() : 0)
                .checkOutTodayCount(request.getCheckOutTodayCount() != null ? request.getCheckOutTodayCount() : 0)
                .notes(request.getNotes())
                .status("SUBMITTED")
                .snapshotDataJson(request.getSnapshotDataJson())
                .build();

        DailyClosingReport saved = dailyClosingReportRepository.save(report);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<DailyReportResponse> getReports(LocalDate fromDate, LocalDate toDate, Pageable pageable) {
        if (fromDate != null && toDate != null) {
            return dailyClosingReportRepository.findByReportDateBetweenOrderByReportDateDescCreatedAtDesc(fromDate, toDate, pageable)
                    .map(this::mapToResponse);
        }
        return dailyClosingReportRepository.findAllByOrderByReportDateDescCreatedAtDesc(pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public DailyReportResponse getReportById(Long id) {
        DailyClosingReport report = dailyClosingReportRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy báo cáo với ID: " + id));
        return mapToResponse(report);
    }

    @Override
    @Transactional
    public DailyReportResponse acknowledgeReport(Long id, String adminUsername) {
        DailyClosingReport report = dailyClosingReportRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy báo cáo với ID: " + id));

        report.setStatus("ACKNOWLEDGED");
        report.setAcknowledgedBy(adminUsername);
        report.setAcknowledgedAt(LocalDateTime.now());

        DailyClosingReport updated = dailyClosingReportRepository.save(report);
        return mapToResponse(updated);
    }

    private DailyReportResponse mapToResponse(DailyClosingReport r) {
        return DailyReportResponse.builder()
                .id(r.getId())
                .reportDate(r.getReportDate())
                .staffUsername(r.getStaffUsername())
                .staffFullName(r.getStaffFullName())
                .createdAt(r.getCreatedAt())
                .totalRevenue(r.getTotalRevenue())
                .cashRevenue(r.getCashRevenue())
                .transferRevenue(r.getTransferRevenue())
                .occupiedRoomsCount(r.getOccupiedRoomsCount())
                .checkInTodayCount(r.getCheckInTodayCount())
                .checkOutTodayCount(r.getCheckOutTodayCount())
                .notes(r.getNotes())
                .status(r.getStatus())
                .acknowledgedBy(r.getAcknowledgedBy())
                .acknowledgedAt(r.getAcknowledgedAt())
                .snapshotDataJson(r.getSnapshotDataJson())
                .build();
    }
}
