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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class CheckoutInvoiceEmailServiceImpl implements CheckoutInvoiceEmailService {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final InvoiceRepository invoiceRepository;
    private final BookingDetailRepository bookingDetailRepository;
    private final BookingServiceItemRepository bookingServiceItemRepository;
    private final ServiceUsageRepository serviceUsageRepository;
    private final RoomAmenitiesUsageRepository roomAmenitiesUsageRepository;
    private final AppliedPenaltyRepository appliedPenaltyRepository;
    private final CheckInRecordRepository checkInRecordRepository;
    private final String invoiceName;
    private final String invoiceSymbol;
    private final String invoiceTemplateSymbol;
    private final String sellerName;
    private final String sellerAddress;
    private final String sellerTaxCode;
    private final String sellerPhone;
    private final String sellerWebsite;
    private final String sellerAccountNo;
    private final String sellerBankName;
    private final String taxAuthorityCode;
    private final BigDecimal vatRate;

    public CheckoutInvoiceEmailServiceImpl(
            InvoiceRepository invoiceRepository,
            BookingDetailRepository bookingDetailRepository,
            BookingServiceItemRepository bookingServiceItemRepository,
            ServiceUsageRepository serviceUsageRepository,
            RoomAmenitiesUsageRepository roomAmenitiesUsageRepository,
            AppliedPenaltyRepository appliedPenaltyRepository,
            CheckInRecordRepository checkInRecordRepository,
            @Value("${app.invoice.name:Hóa đơn thuê homestay}") String invoiceName,
            @Value("${app.invoice.symbol:HD/HMS}") String invoiceSymbol,
            @Value("${app.invoice.template-symbol:01HMS}") String invoiceTemplateSymbol,
            @Value("${app.invoice.seller-name:Hóa đơn thuê homestay}") String sellerName,
            @Value("${app.invoice.seller-address:Thạch Hòa, Thạch Thất, Hà Nội}") String sellerAddress,
            @Value("${app.invoice.seller-tax-code:MST001}") String sellerTaxCode,
            @Value("${app.invoice.seller-phone:}") String sellerPhone,
            @Value("${app.invoice.seller-website:}") String sellerWebsite,
            @Value("${app.invoice.seller-account-no:}") String sellerAccountNo,
            @Value("${app.invoice.seller-bank-name:}") String sellerBankName,
            @Value("${app.invoice.tax-authority-code:MST01}") String taxAuthorityCode,
            @Value("${app.invoice.vat-rate:0.08}") BigDecimal vatRate
    ) {
        this.invoiceRepository = invoiceRepository;
        this.bookingDetailRepository = bookingDetailRepository;
        this.bookingServiceItemRepository = bookingServiceItemRepository;
        this.serviceUsageRepository = serviceUsageRepository;
        this.roomAmenitiesUsageRepository = roomAmenitiesUsageRepository;
        this.appliedPenaltyRepository = appliedPenaltyRepository;
        this.checkInRecordRepository = checkInRecordRepository;
        this.invoiceName = invoiceName;
        this.invoiceSymbol = invoiceSymbol;
        this.invoiceTemplateSymbol = invoiceTemplateSymbol;
        this.sellerName = sellerName;
        this.sellerAddress = sellerAddress;
        this.sellerTaxCode = sellerTaxCode;
        this.sellerPhone = sellerPhone;
        this.sellerWebsite = sellerWebsite;
        this.sellerAccountNo = sellerAccountNo;
        this.sellerBankName = sellerBankName;
        this.taxAuthorityCode = taxAuthorityCode;
        this.vatRate = normalizeVatRate(vatRate);
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
        BigDecimal taxableAmount = totalAmount.divide(BigDecimal.ONE.add(vatRate), 2, RoundingMode.HALF_UP);
        BigDecimal vatAmount = totalAmount.subtract(taxableAmount).setScale(2, RoundingMode.HALF_UP);

        return new CheckoutInvoiceEmailSnapshot(
                invoice.getId(),
                invoiceName,
                invoiceSymbol,
                invoiceTemplateSymbol,
                "HD" + String.format("%02d", invoice.getId()),
                sellerName,
                sellerAddress,
                sellerTaxCode,
                sellerPhone,
                sellerWebsite,
                sellerAccountNo,
                sellerBankName,
                customer.getFullName(),
                customer.getAccount() != null ? customer.getAccount().getEmail() : customer.getEmail(),
                customer.getAddress(),
                booking.getBookingCode(),
                invoice.getCreatedAt(),
                taxAuthorityCode,
                money(invoice.getRoomCharge()),
                money(invoice.getServiceCharge()),
                money(invoice.getPenaltyCharge()),
                taxableAmount,
                vatRate,
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
        return new CheckoutInvoiceEmailLine("Phòng", roomName, description, "Phòng", 1, total, total);
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
                "Lần",
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
                usage.getInventoryService() != null ? "Sản phẩm" : "Lần",
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
                "Sản phẩm",
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
                "Khoản",
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
                "Khoản",
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

    private BigDecimal normalizeVatRate(BigDecimal configuredRate) {
        BigDecimal rate = configuredRate != null ? configuredRate : new BigDecimal("0.08");
        if (rate.compareTo(BigDecimal.ONE) > 0) {
            rate = rate.divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP);
        }
        return rate;
    }

    private int quantity(Integer quantity) {
        return quantity != null && quantity > 0 ? quantity : 1;
    }
}
