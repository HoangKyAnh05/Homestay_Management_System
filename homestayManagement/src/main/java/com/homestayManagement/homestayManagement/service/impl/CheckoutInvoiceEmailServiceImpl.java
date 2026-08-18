package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.email.CheckoutInvoiceEmailLine;
import com.homestayManagement.homestayManagement.dto.email.CheckoutInvoiceEmailSnapshot;
import com.homestayManagement.homestayManagement.entity.AppliedPenalty;
import com.homestayManagement.homestayManagement.entity.Booking;
import com.homestayManagement.homestayManagement.entity.BookingDetail;
import com.homestayManagement.homestayManagement.entity.BookingServiceItem;
import com.homestayManagement.homestayManagement.entity.CheckInRecord;
import com.homestayManagement.homestayManagement.entity.Customer;
import com.homestayManagement.homestayManagement.entity.Invoice;
import com.homestayManagement.homestayManagement.entity.Room;
import com.homestayManagement.homestayManagement.entity.RoomAmenitiesUsage;
import com.homestayManagement.homestayManagement.entity.RoomType;
import com.homestayManagement.homestayManagement.entity.ServiceUsage;
import com.homestayManagement.homestayManagement.repository.AppliedPenaltyRepository;
import com.homestayManagement.homestayManagement.repository.BookingDetailRepository;
import com.homestayManagement.homestayManagement.repository.BookingServiceItemRepository;
import com.homestayManagement.homestayManagement.repository.CheckInRecordRepository;
import com.homestayManagement.homestayManagement.repository.InvoiceRepository;
import com.homestayManagement.homestayManagement.repository.RoomAmenitiesUsageRepository;
import com.homestayManagement.homestayManagement.repository.ServiceUsageRepository;
import com.homestayManagement.homestayManagement.service.CheckoutInvoiceEmailService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class CheckoutInvoiceEmailServiceImpl implements CheckoutInvoiceEmailService {

    private static final BigDecimal VAT_RATE = new BigDecimal("0.08");
    private static final BigDecimal VAT_DIVISOR = new BigDecimal("1.08");
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final InvoiceRepository invoiceRepository;
    private final BookingDetailRepository bookingDetailRepository;
    private final BookingServiceItemRepository bookingServiceItemRepository;
    private final ServiceUsageRepository serviceUsageRepository;
    private final RoomAmenitiesUsageRepository roomAmenitiesUsageRepository;
    private final AppliedPenaltyRepository appliedPenaltyRepository;
    private final CheckInRecordRepository checkInRecordRepository;

    public CheckoutInvoiceEmailServiceImpl(
            InvoiceRepository invoiceRepository,
            BookingDetailRepository bookingDetailRepository,
            BookingServiceItemRepository bookingServiceItemRepository,
            ServiceUsageRepository serviceUsageRepository,
            RoomAmenitiesUsageRepository roomAmenitiesUsageRepository,
            AppliedPenaltyRepository appliedPenaltyRepository,
            CheckInRecordRepository checkInRecordRepository
    ) {
        this.invoiceRepository = invoiceRepository;
        this.bookingDetailRepository = bookingDetailRepository;
        this.bookingServiceItemRepository = bookingServiceItemRepository;
        this.serviceUsageRepository = serviceUsageRepository;
        this.roomAmenitiesUsageRepository = roomAmenitiesUsageRepository;
        this.appliedPenaltyRepository = appliedPenaltyRepository;
        this.checkInRecordRepository = checkInRecordRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public CheckoutInvoiceEmailSnapshot buildSnapshot(Long invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hóa đơn"));
        Booking booking = invoice.getBooking();
        Customer customer = booking.getCustomer();
        List<BookingDetail> details = bookingDetailRepository.findByBookingId(booking.getId()).stream()
                .filter(detail -> !"CANCELLED".equalsIgnoreCase(detail.getStatus()))
                .toList();
        List<Long> detailIds = details.stream().map(BookingDetail::getId).toList();

        List<CheckoutInvoiceEmailLine> lines = new ArrayList<>();
        details.forEach(detail -> lines.add(toRoomLine(detail)));
        if (!detailIds.isEmpty()) {
            bookingServiceItemRepository.findByBookingDetailIds(detailIds).stream()
                    .map(this::toBookedServiceLine)
                    .forEach(lines::add);
        }
        serviceUsageRepository.findByBookingIdForInvoice(booking.getId()).stream()
                .map(this::toServiceUsageLine)
                .forEach(lines::add);
        roomAmenitiesUsageRepository.findByBookingIdForInvoice(booking.getId()).stream()
                .map(this::toMiniBarLine)
                .forEach(lines::add);
        checkInRecordRepository.findByBookingIdForInvoice(booking.getId()).forEach(record -> {
            addTimePenaltyLine(lines, record, "Phí check-in sớm", record.getEarlyCheckInFee());
            addTimePenaltyLine(lines, record, "Phí check-out trễ", record.getLateCheckOutFee());
        });
        appliedPenaltyRepository.findByBookingIdForInvoice(booking.getId()).stream()
                .map(this::toPenaltyLine)
                .forEach(lines::add);

        BigDecimal totalAmount = money(invoice.getTotalAmount());
        BigDecimal taxableAmount = totalAmount.divide(VAT_DIVISOR, 2, RoundingMode.HALF_UP);
        BigDecimal vatAmount = totalAmount.subtract(taxableAmount).setScale(2, RoundingMode.HALF_UP);

        return new CheckoutInvoiceEmailSnapshot(
                invoice.getId(),
                "HÓA ĐƠN DỊCH VỤ LƯU TRÚ",
                "HD/HMS",
                "01HMS",
                "HD" + String.format("%02d", invoice.getId()),
                "Nguyễn Văn A",
                "Thạch Hòa, Thạch Thất, Hà Nội",
                "MST001",
                customer.getFullName(),
                customer.getAccount() != null ? customer.getAccount().getEmail() : null,
                customer.getAddress(),
                booking.getBookingCode(),
                invoice.getCreatedAt(),
                "MST01",
                money(invoice.getRoomCharge()),
                money(invoice.getServiceCharge()),
                money(invoice.getPenaltyCharge()),
                taxableAmount,
                VAT_RATE,
                vatAmount,
                totalAmount,
                lines
        );
    }

    private CheckoutInvoiceEmailLine toRoomLine(BookingDetail detail) {
        Room room = detail.getRoom();
        RoomType roomType = detail.getRoomType() != null ? detail.getRoomType() : room != null ? room.getRoomType() : null;
        String roomName = room != null ? "Phòng " + room.getRoomNumber() : "Phòng chưa gán";
        String typeName = roomType != null ? roomType.getName() : "Loại phòng";
        String description = typeName + " | " + formatStayRange(detail) + " | " + normalizeRentType(detail.getRentType());
        BigDecimal total = money(detail.getPriceAtBooking()).subtract(money(detail.getAllocatedDiscount()));
        if (total.compareTo(BigDecimal.ZERO) < 0) {
            total = BigDecimal.ZERO;
        }
        return new CheckoutInvoiceEmailLine("Phòng", roomName, description, 1, total, total);
    }

    private CheckoutInvoiceEmailLine toBookedServiceLine(BookingServiceItem item) {
        String roomText = roomText(item.getBookingDetail());
        String name = item.getFacilityService() != null ? item.getFacilityService().getName() : item.getInventoryService().getName();
        BigDecimal unitPrice = money(item.getPriceAtBooking());
        int quantity = quantity(item.getQuantity());
        return new CheckoutInvoiceEmailLine(
                "Dịch vụ đặt trước",
                name,
                roomText,
                quantity,
                unitPrice,
                unitPrice.multiply(BigDecimal.valueOf(quantity))
        );
    }

    private CheckoutInvoiceEmailLine toServiceUsageLine(ServiceUsage usage) {
        String name = usage.getFacilityService() != null ? usage.getFacilityService().getName() : usage.getInventoryService().getName();
        BigDecimal unitPrice = money(usage.getPriceAtUse());
        int quantity = quantity(usage.getQuantity());
        return new CheckoutInvoiceEmailLine(
                "Dịch vụ phát sinh",
                name,
                roomText(usage.getCheckInRecord().getBookingDetail()),
                quantity,
                unitPrice,
                unitPrice.multiply(BigDecimal.valueOf(quantity))
        );
    }

    private CheckoutInvoiceEmailLine toMiniBarLine(RoomAmenitiesUsage usage) {
        BigDecimal unitPrice = money(usage.getItem().getPrice());
        int quantity = quantity(usage.getQuantityUsed());
        return new CheckoutInvoiceEmailLine(
                "Mini-bar",
                usage.getItem().getName(),
                roomText(usage.getCheckInRecord().getBookingDetail()),
                quantity,
                unitPrice,
                unitPrice.multiply(BigDecimal.valueOf(quantity))
        );
    }

    private CheckoutInvoiceEmailLine toPenaltyLine(AppliedPenalty penalty) {
        return new CheckoutInvoiceEmailLine(
                "Phí phát sinh",
                penalty.getRulesPenalty().getTitle(),
                roomText(penalty.getCheckRecord().getBookingDetail()),
                1,
                money(penalty.getActualFine()),
                money(penalty.getActualFine())
        );
    }

    private void addTimePenaltyLine(
            List<CheckoutInvoiceEmailLine> lines,
            CheckInRecord record,
            String name,
            BigDecimal amount
    ) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }
        lines.add(new CheckoutInvoiceEmailLine(
                "Phí thời gian",
                name,
                roomText(record.getBookingDetail()),
                1,
                money(amount),
                money(amount)
        ));
    }

    private String formatStayRange(BookingDetail detail) {
        String checkIn = detail.getCheckInTarget() != null ? detail.getCheckInTarget().format(DATE_FORMAT) : "Chưa rõ";
        String checkOut = detail.getCheckOutTarget() != null ? detail.getCheckOutTarget().format(DATE_FORMAT) : "Chưa rõ";
        return checkIn + " - " + checkOut;
    }

    private String roomText(BookingDetail detail) {
        if (detail == null || detail.getRoom() == null) {
            return "Theo booking";
        }
        return "Phòng " + detail.getRoom().getRoomNumber();
    }

    private String normalizeRentType(String rentType) {
        if (rentType == null || rentType.isBlank()) {
            return "Lưu trú";
        }
        return switch (rentType.toUpperCase()) {
            case "HOURLY" -> "Theo giờ";
            case "OVERNIGHT" -> "Qua đêm";
            case "DAILY" -> "Theo ngày";
            default -> rentType;
        };
    }

    private BigDecimal money(BigDecimal value) {
        return (value != null ? value : BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
    }

    private int quantity(Integer quantity) {
        return quantity != null && quantity > 0 ? quantity : 1;
    }
}
