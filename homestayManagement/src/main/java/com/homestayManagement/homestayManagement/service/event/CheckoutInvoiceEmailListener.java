package com.homestayManagement.homestayManagement.service.event;

import com.homestayManagement.homestayManagement.dto.email.CheckoutInvoiceEmailLine;
import com.homestayManagement.homestayManagement.dto.email.CheckoutInvoiceEmailSnapshot;
import com.homestayManagement.homestayManagement.service.CheckoutInvoiceEmailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.util.HtmlUtils;

import java.math.BigDecimal;
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
    private final String mailFrom;

    public CheckoutInvoiceEmailListener(
            JavaMailSender mailSender,
            CheckoutInvoiceEmailService checkoutInvoiceEmailService,
            @Value("${app.mail.from}") String mailFrom
    ) {
        this.mailSender = mailSender;
        this.checkoutInvoiceEmailService = checkoutInvoiceEmailService;
        this.mailFrom = mailFrom;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void sendCheckoutInvoiceEmail(CheckoutInvoiceEmailEvent event) {
        try {
            CheckoutInvoiceEmailSnapshot invoice = checkoutInvoiceEmailService.buildSnapshot(event.invoiceId());
            if (invoice.buyerEmail() == null || invoice.buyerEmail().isBlank()) {
                LOGGER.warn("Không thể gửi hóa đơn {} vì booking không có email khách hàng", event.invoiceId());
                return;
            }

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(mailFrom);
            helper.setTo(invoice.buyerEmail());
            helper.setSubject("Hóa đơn checkout " + invoice.invoiceNumber() + " - booking " + invoice.bookingCode());
            helper.setText(buildPlainText(invoice), buildHtmlEmail(invoice));
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
                Người mua: %s - %s
                Thời điểm lập hóa đơn: %s
                Mã cơ quan thuế/dữ liệu truy xuất: %s

                Chi tiết hàng hóa, dịch vụ:
                %s

                Giá chưa thuế: %s
                VAT 8%%: %s
                Tổng thanh toán đã bao gồm VAT: %s

                Trân trọng,
                Home Stays
                """.formatted(
                invoice.invoiceName(),
                invoice.invoiceNumber(),
                invoice.bookingCode(),
                invoice.sellerName(),
                invoice.sellerAddress(),
                invoice.sellerTaxCode(),
                invoice.buyerName(),
                invoice.buyerEmail(),
                invoice.issuedAt() != null ? invoice.issuedAt().format(DATE_TIME_FORMAT) : "",
                invoice.taxAuthorityCode(),
                buildPlainLineItems(invoice),
                money(invoice.taxableAmount()),
                money(invoice.vatAmount()),
                money(invoice.totalAmount())
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
                <body style="margin:0;padding:0;background:#eef2f0;font-family:Arial,'Helvetica Neue',sans-serif;color:#17211d;">
                  <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="background:#eef2f0;">
                    <tr>
                      <td align="center" style="padding:30px 12px;">
                        <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="max-width:760px;background:#ffffff;border:1px solid #d8e0db;border-radius:18px;overflow:hidden;box-shadow:0 18px 50px rgba(20,42,34,.12);">
                          <tr>
                            <td style="padding:28px 34px;background:#0f4a3a;color:#ffffff;">
                              <table role="presentation" width="100%%" cellspacing="0" cellpadding="0">
                                <tr>
                                  <td style="vertical-align:top;">
                                    <div style="font-family:Georgia,serif;font-size:26px;font-weight:700;">Home Stays</div>
                                    <div style="margin-top:8px;font-size:12px;letter-spacing:1.8px;font-weight:700;color:#f1c66d;">HÓA ĐƠN CHECKOUT</div>
                                  </td>
                                  <td align="right" style="vertical-align:top;font-size:13px;line-height:1.7;color:#d7eee5;">
                                    Ký hiệu: <strong style="color:#ffffff;">%s</strong><br>
                                    Mẫu số: <strong style="color:#ffffff;">%s</strong><br>
                                    Số: <strong style="color:#ffffff;">%s</strong>
                                  </td>
                                </tr>
                              </table>
                              <h1 style="margin:22px 0 0;font-family:Georgia,serif;font-size:31px;line-height:1.2;">%s</h1>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:24px 34px 10px;">
                              <table role="presentation" width="100%%" cellspacing="0" cellpadding="0">
                                <tr>
                                  <td style="width:50%%;padding:16px;border:1px solid #dfe7e2;border-radius:12px;vertical-align:top;">
                                    <div style="font-size:11px;letter-spacing:1px;font-weight:700;color:#7c8a84;">NGƯỜI BÁN</div>
                                    <div style="margin-top:8px;font-size:15px;font-weight:700;color:#143d31;">%s</div>
                                    <div style="margin-top:6px;font-size:13px;line-height:1.55;color:#5e6d66;">%s<br>MST: %s</div>
                                  </td>
                                  <td style="width:12px;"></td>
                                  <td style="width:50%%;padding:16px;border:1px solid #dfe7e2;border-radius:12px;vertical-align:top;">
                                    <div style="font-size:11px;letter-spacing:1px;font-weight:700;color:#7c8a84;">NGƯỜI MUA</div>
                                    <div style="margin-top:8px;font-size:15px;font-weight:700;color:#143d31;">%s</div>
                                    <div style="margin-top:6px;font-size:13px;line-height:1.55;color:#5e6d66;">%s<br>%s</div>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:8px 34px 18px;">
                              <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="background:#f7faf8;border:1px solid #dfe7e2;border-radius:12px;">
                                <tr>
                                  <td style="padding:14px 16px;font-size:13px;color:#5e6d66;">Booking<br><strong style="font-size:15px;color:#143d31;">%s</strong></td>
                                  <td style="padding:14px 16px;font-size:13px;color:#5e6d66;">Thời điểm lập<br><strong style="font-size:15px;color:#143d31;">%s</strong></td>
                                  <td style="padding:14px 16px;font-size:13px;color:#5e6d66;">Mã cơ quan thuế / truy xuất<br><strong style="font-size:15px;color:#143d31;">%s</strong></td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:0 34px 20px;">
                              <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #dfe7e2;border-radius:12px;overflow:hidden;">
                                <thead>
                                  <tr style="background:#edf4f0;color:#143d31;">
                                    <th align="left" style="padding:12px 10px;font-size:12px;">Hàng hóa, dịch vụ</th>
                                    <th align="center" style="padding:12px 8px;font-size:12px;">SL</th>
                                    <th align="right" style="padding:12px 8px;font-size:12px;">Đơn giá</th>
                                    <th align="right" style="padding:12px 10px;font-size:12px;">Thành tiền</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  %s
                                </tbody>
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:0 34px 30px;">
                              <table role="presentation" width="100%%" cellspacing="0" cellpadding="0">
                                <tr>
                                  <td style="width:52%%;padding:16px;background:#fff8e8;border:1px solid #f0dfb9;border-radius:12px;color:#6c5525;font-size:12px;line-height:1.65;vertical-align:top;">
                                    Hóa đơn đã bao gồm toàn bộ phòng trong booking, dịch vụ đặt trước, dịch vụ phát sinh, mini-bar và các khoản phí tại thời điểm checkout.
                                  </td>
                                  <td style="width:16px;"></td>
                                  <td style="padding:0;vertical-align:top;">
                                    <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="font-size:14px;color:#4e5f57;">
                                      <tr><td style="padding:7px 0;">Tiền phòng</td><td align="right" style="padding:7px 0;font-weight:700;">%s</td></tr>
                                      <tr><td style="padding:7px 0;">Dịch vụ</td><td align="right" style="padding:7px 0;font-weight:700;">%s</td></tr>
                                      <tr><td style="padding:7px 0;">Phí phát sinh</td><td align="right" style="padding:7px 0;font-weight:700;">%s</td></tr>
                                      <tr><td style="padding:10px 0;border-top:1px solid #dfe7e2;">Giá bán chưa thuế GTGT</td><td align="right" style="padding:10px 0;border-top:1px solid #dfe7e2;font-weight:700;">%s</td></tr>
                                      <tr><td style="padding:7px 0;">Thuế GTGT 8%%</td><td align="right" style="padding:7px 0;font-weight:700;">%s</td></tr>
                                      <tr><td style="padding:14px 0 0;font-size:16px;font-weight:700;color:#143d31;">Tổng thanh toán</td><td align="right" style="padding:14px 0 0;font-size:19px;font-weight:800;color:#0f4a3a;">%s</td></tr>
                                    </table>
                                  </td>
                                </tr>
                              </table>
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
                escape(invoice.invoiceSymbol()),
                escape(invoice.invoiceTemplateSymbol()),
                escape(invoice.invoiceNumber()),
                escape(invoice.invoiceName()),
                escape(invoice.sellerName()),
                escape(invoice.sellerAddress()),
                escape(invoice.sellerTaxCode()),
                escape(invoice.buyerName()),
                escape(invoice.buyerEmail()),
                escape(defaultText(invoice.buyerAddress(), "Chưa cung cấp địa chỉ")),
                escape(invoice.bookingCode()),
                invoice.issuedAt() != null ? escape(invoice.issuedAt().format(DATE_TIME_FORMAT)) : "",
                escape(invoice.taxAuthorityCode()),
                buildLineRows(invoice),
                money(invoice.roomCharge()),
                money(invoice.serviceCharge()),
                money(invoice.penaltyCharge()),
                money(invoice.taxableAmount()),
                money(invoice.vatAmount()),
                money(invoice.totalAmount())
        );
    }

    private String buildLineRows(CheckoutInvoiceEmailSnapshot invoice) {
        StringBuilder rows = new StringBuilder();
        int index = 0;
        for (CheckoutInvoiceEmailLine line : invoice.lines()) {
            String background = index++ % 2 == 0 ? "#ffffff" : "#fbfdfc";
            rows.append("""
                    <tr style="background:%s;">
                      <td style="padding:12px 10px;border-top:1px solid #e7ede9;vertical-align:top;">
                        <div style="font-size:13px;font-weight:700;color:#17211d;">%s</div>
                        <div style="margin-top:4px;font-size:11px;color:#74827b;">%s · %s</div>
                      </td>
                      <td align="center" style="padding:12px 8px;border-top:1px solid #e7ede9;font-size:13px;">%d</td>
                      <td align="right" style="padding:12px 8px;border-top:1px solid #e7ede9;font-size:13px;">%s</td>
                      <td align="right" style="padding:12px 10px;border-top:1px solid #e7ede9;font-size:13px;font-weight:700;">%s</td>
                    </tr>
                    """.formatted(
                    background,
                    escape(line.name()),
                    escape(line.category()),
                    escape(defaultText(line.description(), "Theo booking")),
                    line.quantity(),
                    money(line.unitPrice()),
                    money(line.totalPrice())
            ));
        }
        return rows.toString();
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

    private String defaultText(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private String escape(String value) {
        return HtmlUtils.htmlEscape(value == null ? "" : value);
    }
}
