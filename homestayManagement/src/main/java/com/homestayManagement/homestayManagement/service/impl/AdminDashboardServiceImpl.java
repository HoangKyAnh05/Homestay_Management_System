package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.response.AdminDashboardKpiResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminDashboardNameValueResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminDashboardOccupancyPointResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminDashboardRevenuePointResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminDashboardSummaryResponse;
import com.homestayManagement.homestayManagement.entity.BookingDetail;
import com.homestayManagement.homestayManagement.entity.Invoice;
import com.homestayManagement.homestayManagement.entity.Room;
import com.homestayManagement.homestayManagement.repository.BookingDetailRepository;
import com.homestayManagement.homestayManagement.repository.InvoiceRepository;
import com.homestayManagement.homestayManagement.repository.RoomRepository;
import com.homestayManagement.homestayManagement.service.AdminDashboardService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AdminDashboardServiceImpl implements AdminDashboardService {

    private final InvoiceRepository invoiceRepository;
    private final BookingDetailRepository bookingDetailRepository;
    private final RoomRepository roomRepository;

    public AdminDashboardServiceImpl(
            InvoiceRepository invoiceRepository,
            BookingDetailRepository bookingDetailRepository,
            RoomRepository roomRepository
    ) {
        this.invoiceRepository = invoiceRepository;
        this.bookingDetailRepository = bookingDetailRepository;
        this.roomRepository = roomRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public AdminDashboardSummaryResponse getSummary(LocalDate fromDate, LocalDate toDate) {
        LocalDate endDate = toDate != null ? toDate : LocalDate.now();
        LocalDate startDate = fromDate != null ? fromDate : endDate.minusDays(29);
        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("Ngày kết thúc phải sau ngày bắt đầu");
        }

        LocalDateTime startInclusive = startDate.atStartOfDay();
        LocalDateTime endExclusive = endDate.plusDays(1).atStartOfDay();
        List<Invoice> invoices = invoiceRepository.findByCreatedAtRangeForDashboard(startInclusive, endExclusive);
        List<BookingDetail> details = bookingDetailRepository.findDashboardDetails(startInclusive, endExclusive);
        int totalRooms = (int) roomRepository.count();

        List<AdminDashboardRevenuePointResponse> revenueTrend = buildRevenueTrend(startDate, endDate, invoices);
        List<AdminDashboardOccupancyPointResponse> occupancyTrend = buildOccupancyTrend(startDate, endDate, details, totalRooms);
        AdminDashboardKpiResponse kpis = buildKpis(invoices, details, totalRooms, occupancyTrend);

        return new AdminDashboardSummaryResponse(
                startDate,
                endDate,
                kpis,
                revenueTrend,
                occupancyTrend,
                buildStatusBreakdown(details),
                buildRevenueBreakdown(kpis),
                buildTopRooms(details),
                buildRoomTypeBreakdown(details)
        );
    }

    private AdminDashboardKpiResponse buildKpis(
            List<Invoice> invoices,
            List<BookingDetail> details,
            int totalRooms,
            List<AdminDashboardOccupancyPointResponse> occupancyTrend
    ) {
        BigDecimal roomRevenue = invoices.stream().map(this::roomCharge).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal serviceRevenue = invoices.stream().map(this::serviceCharge).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal penaltyRevenue = invoices.stream().map(this::penaltyCharge).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalRevenue = invoices.stream().map(this::totalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        long bookingCount = details.stream()
                .map(detail -> detail.getBooking().getId())
                .distinct()
                .count();
        long occupiedRoomNights = occupancyTrend.stream()
                .mapToLong(AdminDashboardOccupancyPointResponse::occupiedRooms)
                .sum();
        double averageOccupancyRate = occupancyTrend.stream()
                .mapToDouble(AdminDashboardOccupancyPointResponse::occupancyRate)
                .average()
                .orElse(0);

        return new AdminDashboardKpiResponse(
                totalRevenue,
                roomRevenue,
                serviceRevenue,
                penaltyRevenue,
                bookingCount,
                occupiedRoomNights,
                totalRooms,
                roundRate(averageOccupancyRate)
        );
    }

    private List<AdminDashboardRevenuePointResponse> buildRevenueTrend(
            LocalDate startDate,
            LocalDate endDate,
            List<Invoice> invoices
    ) {
        Map<LocalDate, List<Invoice>> invoicesByDate = invoices.stream()
                .filter(invoice -> invoice.getCreatedAt() != null)
                .collect(Collectors.groupingBy(invoice -> invoice.getCreatedAt().toLocalDate()));

        return startDate.datesUntil(endDate.plusDays(1))
                .map(date -> {
                    List<Invoice> dayInvoices = invoicesByDate.getOrDefault(date, List.of());
                    BigDecimal roomRevenue = dayInvoices.stream().map(this::roomCharge).reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal serviceRevenue = dayInvoices.stream().map(this::serviceCharge).reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal penaltyRevenue = dayInvoices.stream().map(this::penaltyCharge).reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal totalRevenue = dayInvoices.stream().map(this::totalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
                    return new AdminDashboardRevenuePointResponse(date, roomRevenue, serviceRevenue, penaltyRevenue, totalRevenue);
                })
                .toList();
    }

    private List<AdminDashboardOccupancyPointResponse> buildOccupancyTrend(
            LocalDate startDate,
            LocalDate endDate,
            List<BookingDetail> details,
            int totalRooms
    ) {
        return startDate.datesUntil(endDate.plusDays(1))
                .map(date -> {
                    Set<Long> occupiedRoomIds = details.stream()
                            .filter(this::isActiveDetail)
                            .filter(detail -> overlapsDate(detail, date))
                            .filter(this::hasAssignedRoom)
                            .map(detail -> detail.getRoom().getId())
                            .collect(Collectors.toCollection(HashSet::new));
                    double rate = totalRooms == 0 ? 0 : occupiedRoomIds.size() * 100.0 / totalRooms;
                    return new AdminDashboardOccupancyPointResponse(
                            date,
                            occupiedRoomIds.size(),
                            totalRooms,
                            roundRate(rate)
                    );
                })
                .toList();
    }

    private List<AdminDashboardNameValueResponse> buildStatusBreakdown(List<BookingDetail> details) {
        return details.stream()
                .collect(Collectors.groupingBy(
                        detail -> normalizeStatus(detail.getStatus()),
                        LinkedHashMap::new,
                        Collectors.counting()
                ))
                .entrySet()
                .stream()
                .map(entry -> new AdminDashboardNameValueResponse(entry.getKey(), BigDecimal.valueOf(entry.getValue()), entry.getValue()))
                .toList();
    }

    private List<AdminDashboardNameValueResponse> buildRevenueBreakdown(AdminDashboardKpiResponse kpis) {
        return List.of(
                new AdminDashboardNameValueResponse("Tiền phòng", kpis.roomRevenue(), null),
                new AdminDashboardNameValueResponse("Dịch vụ", kpis.serviceRevenue(), null),
                new AdminDashboardNameValueResponse("Phạt/phụ thu", kpis.penaltyRevenue(), null)
        );
    }

    private List<AdminDashboardNameValueResponse> buildTopRooms(List<BookingDetail> details) {
        Map<String, RoomAggregate> aggregateByRoom = new LinkedHashMap<>();
        details.stream()
                .filter(this::isActiveDetail)
                .filter(this::hasAssignedRoom)
                .forEach(detail -> {
                    Room room = detail.getRoom();
                    String roomName = "Phòng " + room.getRoomNumber();
                    RoomAggregate aggregate = aggregateByRoom.computeIfAbsent(roomName, key -> new RoomAggregate());
                    aggregate.amount = aggregate.amount.add(nullToZero(detail.getPriceAtBooking()));
                    aggregate.count++;
                });

        return aggregateByRoom.entrySet().stream()
                .sorted(Map.Entry.<String, RoomAggregate>comparingByValue(
                        Comparator.comparing(RoomAggregate::amount).reversed()
                ))
                .limit(6)
                .map(entry -> new AdminDashboardNameValueResponse(entry.getKey(), entry.getValue().amount, entry.getValue().count))
                .toList();
    }

    private List<AdminDashboardNameValueResponse> buildRoomTypeBreakdown(List<BookingDetail> details) {
        Map<String, RoomAggregate> aggregateByType = new LinkedHashMap<>();
        details.stream()
                .filter(this::isActiveDetail)
                .forEach(detail -> {
                    String typeName = detail.getRoomType() != null
                            ? detail.getRoomType().getName()
                            : "Chưa phân loại";
                    RoomAggregate aggregate = aggregateByType.computeIfAbsent(typeName, key -> new RoomAggregate());
                    aggregate.amount = aggregate.amount.add(nullToZero(detail.getPriceAtBooking()));
                    aggregate.count++;
                });

        return aggregateByType.entrySet().stream()
                .sorted(Map.Entry.<String, RoomAggregate>comparingByValue(
                        Comparator.comparing(RoomAggregate::count).reversed()
                ))
                .map(entry -> new AdminDashboardNameValueResponse(entry.getKey(), entry.getValue().amount, entry.getValue().count))
                .toList();
    }

    private boolean overlapsDate(BookingDetail detail, LocalDate date) {
        LocalDateTime dayStart = date.atStartOfDay();
        LocalDateTime dayEnd = date.plusDays(1).atStartOfDay();
        return detail.getCheckInTarget().isBefore(dayEnd) && detail.getCheckOutTarget().isAfter(dayStart);
    }

    private boolean isActiveDetail(BookingDetail detail) {
        return !"CANCELLED".equalsIgnoreCase(detail.getStatus())
                && !"CANCELLED".equalsIgnoreCase(detail.getBooking().getStatus());
    }

    private boolean hasAssignedRoom(BookingDetail detail) {
        return detail.getRoom() != null && detail.getRoom().getId() != null;
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            return "UNKNOWN";
        }
        return status.trim().toUpperCase();
    }

    private BigDecimal totalAmount(Invoice invoice) {
        return nullToZero(invoice.getTotalAmount());
    }

    private BigDecimal roomCharge(Invoice invoice) {
        return nullToZero(invoice.getRoomCharge());
    }

    private BigDecimal serviceCharge(Invoice invoice) {
        return nullToZero(invoice.getServiceCharge());
    }

    private BigDecimal penaltyCharge(Invoice invoice) {
        return nullToZero(invoice.getPenaltyCharge());
    }

    private BigDecimal nullToZero(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private double roundRate(double value) {
        return BigDecimal.valueOf(value).setScale(1, RoundingMode.HALF_UP).doubleValue();
    }

    private static class RoomAggregate {
        private BigDecimal amount = BigDecimal.ZERO;
        private long count = 0;

        private BigDecimal amount() {
            return amount;
        }

        private long count() {
            return count;
        }
    }
}
