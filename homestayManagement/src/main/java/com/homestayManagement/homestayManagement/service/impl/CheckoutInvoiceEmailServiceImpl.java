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
import org.springframework.web.util.HtmlUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

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
        return buildSnapshotFromEntity(invoice);
    }

    @Override
    @Transactional(readOnly = true)
    public String renderHtml(Long invoiceId) {
        CheckoutInvoiceEmailSnapshot snapshot = buildSnapshot(invoiceId);
        return renderHtml(snapshot);
    }

    @Override
    public String renderHtml(CheckoutInvoiceEmailSnapshot invoice) {
        if (invoice == null) {
            return "";
        }
        return """
                <!doctype html>
                <html lang="vi">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width,initial-scale=1">
                  <title>%s</title>
                </head>
                <body style="margin:0;padding:0;background:#e8e8e8;font-family:'Times New Roman',Times,serif;color:#111111;">
                  <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="background:#e8e8e8;">
                    <tr>
                      <td align="center" style="padding:24px 10px;">
                        <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="max-width:820px;background:#ffffff;border:3px solid #111111;">
                          <tr>
                            <td style="padding:14px 20px 10px;border-bottom:3px solid #111111;">
                              <table role="presentation" width="100%%" cellspacing="0" cellpadding="0">
                                <tr>
                                  <td style="width:190px;vertical-align:middle;text-align:center;">
                                    <div style="font-family:Arial,'Helvetica Neue',sans-serif;font-size:36px;font-weight:800;color:#d71920;letter-spacing:.5px;">HOME<br>STAY</div>
                                  </td>
                                  <td style="vertical-align:top;font-size:15px;line-height:1.35;">
                                    <div style="font-size:21px;font-weight:800;text-transform:uppercase;">%s</div>
                                    <div>Mã số thuế <em>(Tax code)</em>: <strong>%s</strong></div>
                                    <div>Địa chỉ <em>(Address)</em>: %s</div>
                                    <div>Điện thoại <em>(Tel)</em>: %s</div>
                                    <div>Website: %s &nbsp;&nbsp; Email: %s</div>
                                    <div>Số tài khoản <em>(Account No.)</em>: %s &nbsp;&nbsp; Tại %s</div>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:16px 20px 8px;">
                              <table role="presentation" width="100%%" cellspacing="0" cellpadding="0">
                                <tr>
                                  <td style="width:68%%;text-align:center;vertical-align:top;">
                                    <div style="font-size:25px;font-weight:800;">HÓA ĐƠN GIÁ TRỊ GIA TĂNG</div>
                                    <div style="font-size:18px;font-weight:700;font-style:italic;">(VAT INVOICE)</div>
                                    <div style="margin-top:4px;font-size:17px;font-weight:700;">Bản thể hiện của hóa đơn điện tử</div>
                                    <div style="font-size:15px;font-style:italic;">(Electronic invoice display)</div>
                                    <div style="margin-top:8px;font-size:15px;">Ngày <em>(date)</em> %s tháng <em>(month)</em> %s năm <em>(year)</em> %s</div>
                                  </td>
                                  <td style="width:32%%;vertical-align:top;font-size:15px;line-height:1.45;">
                                    <div>Mẫu số <em>(Form)</em>: <strong>%s</strong></div>
                                    <div>Ký hiệu <em>(Serial)</em>: <strong>%s</strong></div>
                                    <div>Số <em>(Invoice No)</em>: <strong>%s</strong></div>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:8px 20px 10px;font-size:15px;line-height:1.45;">
                              <div>Họ tên người mua hàng <em>(Attention)</em>: <strong>%s</strong></div>
                              <div>Email: %s</div>
                              <div>Địa chỉ <em>(Address)</em>: %s</div>
                              <div>Mã booking <em>(Booking code)</em>: <strong>%s</strong> &nbsp;&nbsp; Phương thức thanh toán <em>(Payment method)</em>: TM/CK</div>
                              <div>Ghi chú <em>(Note)</em>: Hóa đơn thuê homestay, bao gồm phòng và dịch vụ đã sử dụng.</div>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:0 20px 0;">
                              <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:2px solid #111111;font-size:15px;">
                                <thead>
                                  <tr>
                                    <th align="center" style="width:52px;padding:8px 6px;border:1px solid #111111;font-weight:800;">STT<br><em>(No.)</em></th>
                                    <th align="center" style="padding:8px 8px;border:1px solid #111111;font-weight:800;">Tên hàng hóa, dịch vụ<br><em>(Description)</em></th>
                                    <th align="center" style="width:82px;padding:8px 6px;border:1px solid #111111;font-weight:800;">Đơn vị tính<br><em>(Unit)</em></th>
                                    <th align="center" style="width:80px;padding:8px 6px;border:1px solid #111111;font-weight:800;">Số lượng<br><em>(Quantity)</em></th>
                                    <th align="center" style="width:110px;padding:8px 6px;border:1px solid #111111;font-weight:800;">Đơn giá<br><em>(Unit price)</em></th>
                                    <th align="center" style="width:120px;padding:8px 6px;border:1px solid #111111;font-weight:800;">Thành tiền<br><em>(Amount)</em></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  %s
                                  %s
                                  <tr>
                                    <td colspan="3" style="padding:10px 10px;border:1px solid #111111;font-weight:800;font-size:15px;vertical-align:middle;">
                                      Thuế suất GTGT <em>(VAT rate)</em>: %s
                                    </td>
                                    <td colspan="2" align="right" style="padding:10px 10px;border:1px solid #111111;font-weight:800;font-size:15px;line-height:1.35;vertical-align:middle;">
                                      Tổng cộng tiền thanh toán<br><em>(Total amount)</em>:<br>
                                      <span style="font-size:12px;font-weight:normal;font-style:italic;color:#333333;">(Đã bao gồm thuế GTGT / VAT included)</span>
                                    </td>
                                    <td align="right" style="padding:10px 10px;border:1px solid #111111;font-weight:800;font-size:16px;vertical-align:middle;">
                                      %s
                                    </td>
                                  </tr>
                                  <tr>
                                    <td colspan="6" style="padding:8px 10px;border:1px solid #111111;"><strong>Số tiền viết bằng chữ <em>(Amount in words)</em>:</strong> %s</td>
                                  </tr>
                                </tbody>
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:24px 20px 26px;">
                              <table role="presentation" width="100%%" cellspacing="0" cellpadding="0">
                                <tr>
                                  <td align="center" style="width:50%%;font-size:17px;font-weight:800;vertical-align:top;">
                                    Người mua hàng <em>(Client)</em>
                                  </td>
                                  <td align="center" style="width:50%%;font-size:17px;font-weight:800;vertical-align:top;">
                                    Người bán hàng <em>(Seller)</em>
                                    <div style="margin-top:16px;font-size:15px;font-weight:400;color:#555555;">Signature valid <span style="color:#22863a;font-size:20px;">✓</span></div>
                                    <div style="margin-top:6px;font-size:14px;font-weight:400;color:#c00000;">Ký bởi %s</div>
                                    <div style="font-size:14px;font-weight:400;color:#c00000;">Ký ngày %s</div>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td align="center" style="padding:10px 20px 14px;border-top:1px dotted #111111;font-size:14px;line-height:1.45;font-style:italic;">
                              Tra cứu hóa đơn điện tử tại Website: %s . Mã số bí mật: %s%s
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(
                escape(invoice.invoiceName()),
                escape(invoice.sellerName()),
                escape(invoice.sellerTaxCode()),
                escape(invoice.sellerAddress()),
                escape(defaultText(invoice.sellerPhone(), "Chưa cấu hình")),
                escape(defaultText(invoice.sellerWebsite(), "Chưa cấu hình")),
                "support@ladohomestay.vn",
                escape(defaultText(invoice.sellerAccountNo(), "Chưa cấu hình")),
                escape(defaultText(invoice.sellerBankName(), "Chưa cấu hình")),
                issuedDay(invoice),
                issuedMonth(invoice),
                issuedYear(invoice),
                escape(invoice.invoiceTemplateSymbol()),
                escape(invoice.invoiceSymbol()),
                escape(invoice.invoiceNumber()),
                escape(invoice.buyerName()),
                escape(invoice.buyerEmail()),
                escape(defaultText(invoice.buyerAddress(), "Chưa cung cấp địa chỉ")),
                escape(invoice.bookingCode()),
                buildLineRows(invoice),
                buildEmptyRows(invoice.lines().size()),
                percent(invoice.vatRate()),
                money(invoice.totalAmount()),
                escape(amountInWords(invoice.totalAmount())),
                escape(invoice.sellerName()),
                issuedDate(invoice),
                escape(defaultText(invoice.sellerWebsite(), "")),
                escape(invoice.invoiceSymbol()),
                escape(invoice.invoiceNumber())
        );
    }

    private CheckoutInvoiceEmailSnapshot buildSnapshotFromEntity(Invoice invoice) {
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

    private static final Locale VIETNAM = Locale.forLanguageTag("vi-VN");

    private String buildLineRows(CheckoutInvoiceEmailSnapshot invoice) {
        StringBuilder rows = new StringBuilder();
        int index = 1;
        for (CheckoutInvoiceEmailLine line : invoice.lines()) {
            rows.append("""
                    <tr>
                      <td align="center" style="padding:7px 6px;border:1px solid #111111;">%d</td>
                      <td style="padding:7px 8px;border:1px solid #111111;vertical-align:top;">
                        <div>%s</div>
                        <div style="font-size:12px;color:#444444;font-style:italic;">%s - %s</div>
                      </td>
                      <td align="center" style="padding:7px 6px;border:1px solid #111111;">%s</td>
                      <td align="right" style="padding:7px 6px;border:1px solid #111111;">%d</td>
                      <td align="right" style="padding:7px 6px;border:1px solid #111111;">%s</td>
                      <td align="right" style="padding:7px 8px;border:1px solid #111111;">%s</td>
                    </tr>
                    """.formatted(
                    index++,
                    escape(line.name()),
                    escape(line.category()),
                    escape(defaultText(line.description(), "Theo booking")),
                    escape(defaultText(line.unit(), "Lần")),
                    line.quantity(),
                    formatCurrency(line.unitPrice()),
                    formatCurrency(line.totalPrice())
            ));
        }
        return rows.toString();
    }

    private String buildEmptyRows(int itemCount) {
        int emptyCount = Math.max(0, 8 - itemCount);
        return """
                <tr><td colspan="6" style="height:24px;border:1px solid #111111;">&nbsp;</td></tr>
                """.repeat(emptyCount);
    }

    private String formatCurrency(BigDecimal value) {
        NumberFormat format = NumberFormat.getCurrencyInstance(VIETNAM);
        format.setMaximumFractionDigits(0);
        format.setMinimumFractionDigits(0);
        return format.format(value == null ? BigDecimal.ZERO : value);
    }

    private String percent(BigDecimal value) {
        BigDecimal percentValue = (value == null ? BigDecimal.ZERO : value).multiply(new BigDecimal("100"));
        return percentValue.stripTrailingZeros().toPlainString() + " %";
    }

    private String amountInWords(BigDecimal value) {
        long amount = (value == null ? BigDecimal.ZERO : value)
                .setScale(0, RoundingMode.HALF_UP)
                .longValue();
        if (amount == 0) {
            return "Không đồng chẵn.";
        }
        return capitalize(readNumber(amount)) + " đồng chẵn.";
    }

    private String readNumber(long number) {
        String[] units = {"", " nghìn", " triệu", " tỷ"};
        StringBuilder result = new StringBuilder();
        int unitIndex = 0;
        boolean hasHigher = false;
        while (number > 0 && unitIndex < units.length) {
            int group = (int) (number % 1000);
            if (group > 0) {
                String groupText = readThreeDigits(group, hasHigher);
                result.insert(0, groupText + units[unitIndex] + (result.isEmpty() ? "" : " "));
                hasHigher = true;
            }
            number /= 1000;
            unitIndex++;
        }
        if (number > 0) {
            result.insert(0, readNumber(number) + " tỷ ");
        }
        return result.toString().trim();
    }

    private String readThreeDigits(int number, boolean full) {
        String[] digitWords = {"không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"};
        int hundreds = number / 100;
        int tens = (number % 100) / 10;
        int ones = number % 10;
        StringBuilder text = new StringBuilder();
        if (hundreds > 0 || full) {
            text.append(digitWords[hundreds]).append(" trăm");
            if (tens == 0 && ones > 0) {
                text.append(" linh");
            }
        }
        if (tens > 1) {
            appendSpace(text).append(digitWords[tens]).append(" mươi");
            if (ones == 1) {
                text.append(" mốt");
            } else if (ones == 5) {
                text.append(" lăm");
            } else if (ones > 0) {
                text.append(" ").append(digitWords[ones]);
            }
        } else if (tens == 1) {
            appendSpace(text).append("mười");
            if (ones == 5) {
                text.append(" lăm");
            } else if (ones > 0) {
                text.append(" ").append(digitWords[ones]);
            }
        } else if (ones > 0) {
            appendSpace(text).append(digitWords[ones]);
        }
        return text.toString();
    }

    private StringBuilder appendSpace(StringBuilder text) {
        if (!text.isEmpty()) {
            text.append(" ");
        }
        return text;
    }

    private String capitalize(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        return value.substring(0, 1).toUpperCase(VIETNAM) + value.substring(1);
    }

    private String issuedDay(CheckoutInvoiceEmailSnapshot invoice) {
        return invoice.issuedAt() != null ? String.format("%02d", invoice.issuedAt().getDayOfMonth()) : "";
    }

    private String issuedMonth(CheckoutInvoiceEmailSnapshot invoice) {
        return invoice.issuedAt() != null ? String.format("%02d", invoice.issuedAt().getMonthValue()) : "";
    }

    private String issuedYear(CheckoutInvoiceEmailSnapshot invoice) {
        return invoice.issuedAt() != null ? String.valueOf(invoice.issuedAt().getYear()) : "";
    }

    private String issuedDate(CheckoutInvoiceEmailSnapshot invoice) {
        return invoice.issuedAt() != null ? invoice.issuedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "";
    }

    private String defaultText(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private String escape(String value) {
        return HtmlUtils.htmlEscape(value == null ? "" : value);
    }
}
