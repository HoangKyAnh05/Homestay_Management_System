package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.response.AdminDashboardKpiResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminDashboardNameValueResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminDashboardOccupancyPointResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminDashboardRevenuePointResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminDashboardSummaryResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminDashboardCashStatisticsResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminDashboardCashTransactionResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminDashboardCashDailyPointResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminDashboardCardStatisticsResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminDashboardCardTransactionResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminDashboardCardDailyPointResponse;
import com.homestayManagement.homestayManagement.entity.Booking;
import com.homestayManagement.homestayManagement.entity.BookingDetail;
import com.homestayManagement.homestayManagement.entity.Invoice;
import com.homestayManagement.homestayManagement.entity.Payment;
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
    private final com.homestayManagement.homestayManagement.repository.RoomIncidentRepository roomIncidentRepository;
    private final com.homestayManagement.homestayManagement.repository.PaymentRepository paymentRepository;

    @org.springframework.beans.factory.annotation.Autowired
    public AdminDashboardServiceImpl(
            InvoiceRepository invoiceRepository,
            BookingDetailRepository bookingDetailRepository,
            RoomRepository roomRepository,
            com.homestayManagement.homestayManagement.repository.RoomIncidentRepository roomIncidentRepository,
            com.homestayManagement.homestayManagement.repository.PaymentRepository paymentRepository
    ) {
        this.invoiceRepository = invoiceRepository;
        this.bookingDetailRepository = bookingDetailRepository;
        this.roomRepository = roomRepository;
        this.roomIncidentRepository = roomIncidentRepository;
        this.paymentRepository = paymentRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public AdminDashboardSummaryResponse getSummary(LocalDate fromDate, LocalDate toDate) {
        LocalDate endDate = toDate != null ? toDate : LocalDate.now();
        LocalDate startDate = fromDate != null ? fromDate : endDate.minusMonths(1);
        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("Ngày kết thúc phải sau ngày bắt đầu");
        }

        LocalDateTime startInclusive = startDate.atStartOfDay();
        LocalDateTime endExclusive = endDate.plusDays(1).atStartOfDay();
        List<Invoice> invoices = invoiceRepository.findByCreatedAtRangeForDashboard(startInclusive, endExclusive);
        List<BookingDetail> details = bookingDetailRepository.findDashboardDetails(startInclusive, endExclusive);
        List<com.homestayManagement.homestayManagement.entity.RoomIncident> incidents = roomIncidentRepository != null
                ? roomIncidentRepository.findByReportedAtRange(startInclusive, endExclusive)
                : List.of();
        int totalRooms = (int) roomRepository.count();

        List<AdminDashboardRevenuePointResponse> revenueTrend = buildRevenueTrend(startDate, endDate, invoices);
        List<AdminDashboardOccupancyPointResponse> occupancyTrend = buildOccupancyTrend(startDate, endDate, details, totalRooms);
        AdminDashboardKpiResponse kpis = buildKpis(invoices, details, incidents, totalRooms, occupancyTrend);
        AdminDashboardCashStatisticsResponse cashStatistics = buildCashStatistics(startDate, endDate, startInclusive, endExclusive);
        AdminDashboardCardStatisticsResponse cardStatistics = buildCardStatistics(startDate, endDate, startInclusive, endExclusive);

        return new AdminDashboardSummaryResponse(
                startDate,
                endDate,
                kpis,
                revenueTrend,
                occupancyTrend,
                buildStatusBreakdown(details),
                buildRevenueBreakdown(kpis),
                buildTopRooms(details),
                buildRoomTypeBreakdown(details),
                cashStatistics,
                cardStatistics
        );
    }

    private boolean isBookingCheckedOut(Booking booking) {
        if (booking == null || booking.getStatus() == null) {
            return false;
        }
        String status = booking.getStatus().trim().toUpperCase();
        return "COMPLETED".equals(status) || "CHECKED_OUT".equals(status);
    }

    private AdminDashboardKpiResponse buildKpis(
            List<Invoice> invoices,
            List<BookingDetail> details,
            List<com.homestayManagement.homestayManagement.entity.RoomIncident> incidents,
            int totalRooms,
            List<AdminDashboardOccupancyPointResponse> occupancyTrend
    ) {
        List<Invoice> checkedOutInvoices = invoices.stream()
                .filter(inv -> isBookingCheckedOut(inv.getBooking()))
                .toList();

        BigDecimal roomRevenue = checkedOutInvoices.stream().map(this::roomCharge).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal serviceRevenue = checkedOutInvoices.stream().map(this::serviceCharge).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal penaltyRevenue = checkedOutInvoices.stream().map(this::penaltyCharge).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalRevenue = checkedOutInvoices.stream().map(this::totalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal maintenanceExpense = incidents.stream()
                .filter(i -> "HOMESTAY".equalsIgnoreCase(i.getLiability()))
                .filter(i -> !"DISMISSED".equalsIgnoreCase(i.getStatus()))
                .map(i -> i.getCompensationAmount() != null ? i.getCompensationAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
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
                maintenanceExpense,
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
        List<Invoice> checkedOutInvoices = invoices.stream()
                .filter(inv -> isBookingCheckedOut(inv.getBooking()))
                .toList();

        Map<LocalDate, List<Invoice>> invoicesByDate = checkedOutInvoices.stream()
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

    private AdminDashboardCashStatisticsResponse buildCashStatistics(
            LocalDate startDate,
            LocalDate endDate,
            LocalDateTime startInclusive,
            LocalDateTime endExclusive
    ) {
        LocalDate today = LocalDate.now();
        LocalDateTime todayStart = today.atStartOfDay();
        LocalDateTime todayEnd = today.plusDays(1).atStartOfDay();

        LocalDate monday = today.minusDays(today.getDayOfWeek().getValue() - 1);
        LocalDateTime weekStart = monday.atStartOfDay();

        LocalDate firstDayOfMonth = today.withDayOfMonth(1);
        LocalDateTime monthStart = firstDayOfMonth.atStartOfDay();

        BigDecimal cashToday = nullToZero(paymentRepository.sumCashPaymentsBetween(todayStart, todayEnd));
        BigDecimal cashThisWeek = nullToZero(paymentRepository.sumCashPaymentsBetween(weekStart, todayEnd));
        BigDecimal cashThisMonth = nullToZero(paymentRepository.sumCashPaymentsBetween(monthStart, todayEnd));

        List<Payment> paymentsInRange = paymentRepository.findSuccessfulPaymentsBetween(startInclusive, endExclusive);

        BigDecimal cashInRange = BigDecimal.ZERO;
        BigDecimal transferInRange = BigDecimal.ZERO;

        Map<LocalDate, BigDecimal> dailyCashMap = new LinkedHashMap<>();
        Map<LocalDate, BigDecimal> dailyTransferMap = new LinkedHashMap<>();
        Map<LocalDate, Integer> dailyCashCountMap = new LinkedHashMap<>();

        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            dailyCashMap.put(date, BigDecimal.ZERO);
            dailyTransferMap.put(date, BigDecimal.ZERO);
            dailyCashCountMap.put(date, 0);
        }

        List<AdminDashboardCashTransactionResponse> cashTransactions = new java.util.ArrayList<>();

        for (Payment p : paymentsInRange) {
            BigDecimal amt = nullToZero(p.getAmount());
            boolean isCash = "CASH".equalsIgnoreCase(p.getPaymentMethod());
            LocalDate pDate = p.getPaymentTime() != null ? p.getPaymentTime().toLocalDate() : null;

            if (isCash) {
                cashInRange = cashInRange.add(amt);
                if (pDate != null && dailyCashMap.containsKey(pDate)) {
                    dailyCashMap.put(pDate, dailyCashMap.get(pDate).add(amt));
                    dailyCashCountMap.put(pDate, dailyCashCountMap.get(pDate) + 1);
                }

                String bookingCode = "N/A";
                String customerName = "Khách hàng";
                if (p.getInvoice() != null && p.getInvoice().getBooking() != null) {
                    Booking b = p.getInvoice().getBooking();
                    bookingCode = b.getBookingCode() != null ? b.getBookingCode() : ("#" + b.getId());
                    if (b.getCustomer() != null && b.getCustomer().getFullName() != null) {
                        customerName = b.getCustomer().getFullName();
                    }
                }

                cashTransactions.add(new AdminDashboardCashTransactionResponse(
                        p.getId(),
                        bookingCode,
                        customerName,
                        p.getPaymentPurpose() != null ? p.getPaymentPurpose() : "BOOKING",
                        p.getPaymentTime(),
                        amt,
                        p.getStatus()
                ));
            } else {
                transferInRange = transferInRange.add(amt);
                if (pDate != null && dailyTransferMap.containsKey(pDate)) {
                    dailyTransferMap.put(pDate, dailyTransferMap.get(pDate).add(amt));
                }
            }
        }

        List<AdminDashboardCashDailyPointResponse> dailyCashTrend = new java.util.ArrayList<>();
        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            BigDecimal c = dailyCashMap.getOrDefault(date, BigDecimal.ZERO);
            BigDecimal t = dailyTransferMap.getOrDefault(date, BigDecimal.ZERO);
            int count = dailyCashCountMap.getOrDefault(date, 0);
            dailyCashTrend.add(new AdminDashboardCashDailyPointResponse(
                    date,
                    c,
                    t,
                    c.add(t),
                    count
            ));
        }

        BigDecimal totalInRange = cashInRange.add(transferInRange);

        return new AdminDashboardCashStatisticsResponse(
                cashToday,
                cashThisWeek,
                cashThisMonth,
                cashInRange,
                transferInRange,
                totalInRange,
                dailyCashTrend,
                cashTransactions
        );
    }

    private boolean isCardPayment(String method) {
        if (method == null) return false;
        String m = method.trim().toUpperCase();
        return m.contains("CARD") || m.contains("POS") || m.contains("ATM")
                || m.contains("DEBIT") || m.contains("CREDIT") || m.contains("THẺ") || m.contains("THE");
    }

    private boolean isCombinedPayment(String method) {
        if (method == null) return false;
        String m = method.trim().toUpperCase();
        return (m.contains("CARD") || m.contains("POS") || m.contains("ATM")) &&
                (m.contains("QR") || m.contains("SEPAY") || m.contains("TRANSFER") || m.contains("SPLIT") || m.contains("COMBINED") || m.contains("CASH"));
    }

    private AdminDashboardCardStatisticsResponse buildCardStatistics(
            LocalDate startDate,
            LocalDate endDate,
            LocalDateTime startInclusive,
            LocalDateTime endExclusive
    ) {
        LocalDate today = LocalDate.now();
        LocalDateTime todayStart = today.atStartOfDay();
        LocalDateTime todayEnd = today.plusDays(1).atStartOfDay();

        LocalDate monday = today.minusDays(today.getDayOfWeek().getValue() - 1);
        LocalDateTime weekStart = monday.atStartOfDay();

        LocalDate firstDayOfMonth = today.withDayOfMonth(1);
        LocalDateTime monthStart = firstDayOfMonth.atStartOfDay();

        LocalDateTime earliest = monthStart.isBefore(startInclusive) ? monthStart : startInclusive;
        if (weekStart.isBefore(earliest)) earliest = weekStart;
        if (todayStart.isBefore(earliest)) earliest = todayStart;

        LocalDateTime latest = todayEnd.isAfter(endExclusive) ? todayEnd : endExclusive;

        List<Payment> allPayments = paymentRepository.findSuccessfulPaymentsBetween(earliest, latest);

        BigDecimal cardToday = BigDecimal.ZERO;
        BigDecimal cardThisWeek = BigDecimal.ZERO;
        BigDecimal cardThisMonth = BigDecimal.ZERO;

        for (Payment p : allPayments) {
            if (p.getPaymentTime() == null) continue;
            if (isCardPayment(p.getPaymentMethod())) {
                BigDecimal amt = nullToZero(p.getAmount());
                LocalDateTime pt = p.getPaymentTime();
                if (!pt.isBefore(todayStart) && pt.isBefore(todayEnd)) {
                    cardToday = cardToday.add(amt);
                }
                if (!pt.isBefore(weekStart) && pt.isBefore(todayEnd)) {
                    cardThisWeek = cardThisWeek.add(amt);
                }
                if (!pt.isBefore(monthStart) && pt.isBefore(todayEnd)) {
                    cardThisMonth = cardThisMonth.add(amt);
                }
            }
        }

        BigDecimal cardInRange = BigDecimal.ZERO;
        BigDecimal pureCardInRange = BigDecimal.ZERO;
        BigDecimal combinedInRange = BigDecimal.ZERO;

        Map<LocalDate, BigDecimal> dailyCardMap = new LinkedHashMap<>();
        Map<LocalDate, BigDecimal> dailyPureCardMap = new LinkedHashMap<>();
        Map<LocalDate, BigDecimal> dailyCombinedMap = new LinkedHashMap<>();
        Map<LocalDate, Integer> dailyCardCountMap = new LinkedHashMap<>();

        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            dailyCardMap.put(date, BigDecimal.ZERO);
            dailyPureCardMap.put(date, BigDecimal.ZERO);
            dailyCombinedMap.put(date, BigDecimal.ZERO);
            dailyCardCountMap.put(date, 0);
        }

        List<AdminDashboardCardTransactionResponse> cardTransactions = new java.util.ArrayList<>();

        for (Payment p : allPayments) {
            if (p.getPaymentTime() == null) continue;
            LocalDateTime pt = p.getPaymentTime();
            if (pt.isBefore(startInclusive) || !pt.isBefore(endExclusive)) {
                continue;
            }

            if (isCardPayment(p.getPaymentMethod())) {
                BigDecimal amt = nullToZero(p.getAmount());
                boolean combined = isCombinedPayment(p.getPaymentMethod());
                LocalDate pDate = pt.toLocalDate();

                cardInRange = cardInRange.add(amt);
                if (combined) {
                    combinedInRange = combinedInRange.add(amt);
                } else {
                    pureCardInRange = pureCardInRange.add(amt);
                }

                if (dailyCardMap.containsKey(pDate)) {
                    dailyCardMap.put(pDate, dailyCardMap.get(pDate).add(amt));
                    dailyCardCountMap.put(pDate, dailyCardCountMap.get(pDate) + 1);
                    if (combined) {
                        dailyCombinedMap.put(pDate, dailyCombinedMap.get(pDate).add(amt));
                    } else {
                        dailyPureCardMap.put(pDate, dailyPureCardMap.get(pDate).add(amt));
                    }
                }

                String bookingCode = "N/A";
                String customerName = "Khách hàng";
                if (p.getInvoice() != null && p.getInvoice().getBooking() != null) {
                    Booking b = p.getInvoice().getBooking();
                    bookingCode = b.getBookingCode() != null ? b.getBookingCode() : ("#" + b.getId());
                    if (b.getCustomer() != null && b.getCustomer().getFullName() != null) {
                        customerName = b.getCustomer().getFullName();
                    }
                }

                cardTransactions.add(new AdminDashboardCardTransactionResponse(
                        p.getId(),
                        bookingCode,
                        customerName,
                        p.getPaymentPurpose() != null ? p.getPaymentPurpose() : "BOOKING",
                        p.getPaymentMethod(),
                        combined,
                        p.getPaymentTime(),
                        amt,
                        p.getStatus()
                ));
            }
        }

        List<AdminDashboardCardDailyPointResponse> dailyCardTrend = new java.util.ArrayList<>();
        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            BigDecimal c = dailyCardMap.getOrDefault(date, BigDecimal.ZERO);
            BigDecimal pure = dailyPureCardMap.getOrDefault(date, BigDecimal.ZERO);
            BigDecimal comb = dailyCombinedMap.getOrDefault(date, BigDecimal.ZERO);
            int count = dailyCardCountMap.getOrDefault(date, 0);
            dailyCardTrend.add(new AdminDashboardCardDailyPointResponse(
                    date,
                    c,
                    pure,
                    comb,
                    count
            ));
        }

        return new AdminDashboardCardStatisticsResponse(
                cardToday,
                cardThisWeek,
                cardThisMonth,
                cardInRange,
                pureCardInRange,
                combinedInRange,
                dailyCardTrend,
                cardTransactions
        );
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
