package com.homestayManagement.homestayManagement.service.event;

import com.homestayManagement.homestayManagement.dto.email.CheckoutInvoiceEmailLine;
import com.homestayManagement.homestayManagement.dto.email.CheckoutInvoiceEmailSnapshot;
import com.homestayManagement.homestayManagement.service.CheckoutInvoiceEmailService;
import com.homestayManagement.homestayManagement.service.InvoiceStorageService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.util.HtmlUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Component
public class CheckoutInvoiceEmailListener {

    private static final Logger LOGGER = LoggerFactory.getLogger(CheckoutInvoiceEmailListener.class);
    private static final DateTimeFormatter DATE_TIME_FORMAT = DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy");
    private static final Locale VIETNAM = Locale.forLanguageTag("vi-VN");

    private final JavaMailSender mailSender;
    private final CheckoutInvoiceEmailService checkoutInvoiceEmailService;
    private final InvoiceStorageService invoiceStorageService;
    private final String mailFrom;

    public CheckoutInvoiceEmailListener(
            JavaMailSender mailSender,
            CheckoutInvoiceEmailService checkoutInvoiceEmailService,
            InvoiceStorageService invoiceStorageService,
            @Value("${app.mail.from}") String mailFrom
    ) {
        this.mailSender = mailSender;
        this.checkoutInvoiceEmailService = checkoutInvoiceEmailService;
        this.invoiceStorageService = invoiceStorageService;
        this.mailFrom = mailFrom;
    }

    @Async("mailTaskExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void sendCheckoutInvoiceEmail(CheckoutInvoiceEmailEvent event) {
        try {
            CheckoutInvoiceEmailSnapshot invoice = checkoutInvoiceEmailService.buildSnapshot(event.invoiceId());
            String htmlContent = buildHtmlEmail(invoice);

            // Lưu hóa đơn vào thư mục invoive trong backend
            if (invoiceStorageService != null) {
                invoiceStorageService.saveInvoiceHtml(invoice, htmlContent);
            }

            if (invoice.buyerEmail() == null || invoice.buyerEmail().isBlank()) {
                LOGGER.warn("Không thể gửi hóa đơn {} vì booking không có email khách hàng", event.invoiceId());
                return;
            }

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(mailFrom);
            helper.setTo(invoice.buyerEmail());
            helper.setSubject("Hóa đơn checkout " + invoice.invoiceNumber() + " - booking " + invoice.bookingCode());
            helper.setText(buildPlainText(invoice), htmlContent);
            mailSender.send(message);
        } catch (MessagingException | RuntimeException exception) {
            LOGGER.error("Không thể gửi email hóa đơn checkout {}", event.invoiceId(), exception);
        }
    }

    private String buildPlainText(CheckoutInvoiceEmailSnapshot invoice) {
        return """
                %s
                Số hóa đơn: %s
                Booking: %s
                Người bán: %s - %s - %s
                Điện thoại: %s
                Website: %s
                Số tài khoản: %s - Ngân hàng: %s
                Họ tên người mua hàng: %s
                Email người mua: %s
                Thời điểm lập hóa đơn: %s
                Mã cơ quan thuế/dữ liệu truy xuất: %s

                Chi tiết hàng hóa, dịch vụ:
                %s

                Thuế suất GTGT: %s
                Tổng cộng tiền thanh toán (đã bao gồm thuế GTGT): %s
                Số tiền viết bằng chữ: %s

                Trân trọng,
                Home Stays
                """.formatted(
                invoice.invoiceName(),
                invoice.invoiceNumber(),
                invoice.bookingCode(),
                invoice.sellerName(),
                invoice.sellerAddress(),
                invoice.sellerTaxCode(),
                defaultText(invoice.sellerPhone(), "Chưa cấu hình"),
                defaultText(invoice.sellerWebsite(), "Chưa cấu hình"),
                defaultText(invoice.sellerAccountNo(), "Chưa cấu hình"),
                defaultText(invoice.sellerBankName(), "Chưa cấu hình"),
                invoice.buyerName(),
                invoice.buyerEmail(),
                invoice.issuedAt() != null ? invoice.issuedAt().format(DATE_TIME_FORMAT) : "",
                invoice.taxAuthorityCode(),
                buildPlainLineItems(invoice),
                percent(invoice.vatRate()),
                money(invoice.totalAmount()),
                amountInWords(invoice.totalAmount())
        );
    }

    private String buildHtmlEmail(CheckoutInvoiceEmailSnapshot invoice) {
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
                escape(mailFrom),
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
                    money(line.unitPrice()),
                    money(line.totalPrice())
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

    private String buildPlainLineItems(CheckoutInvoiceEmailSnapshot invoice) {
        StringBuilder lines = new StringBuilder();
        for (CheckoutInvoiceEmailLine line : invoice.lines()) {
            lines.append("- ")
                    .append(defaultText(line.name(), "Dịch vụ"))
                    .append(" | ")
                    .append(defaultText(line.category(), "Hàng hóa, dịch vụ"))
                    .append(" | ")
                    .append(defaultText(line.description(), "Theo booking"))
                    .append(" | ĐVT: ")
                    .append(defaultText(line.unit(), "Lần"))
                    .append(" | SL: ")
                    .append(line.quantity())
                    .append(" | Đơn giá: ")
                    .append(money(line.unitPrice()))
                    .append(" | Thành tiền: ")
                    .append(money(line.totalPrice()))
                    .append('\n');
        }
        return lines.toString();
    }

    private String money(BigDecimal value) {
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
