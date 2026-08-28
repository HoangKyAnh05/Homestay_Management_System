package com.homestayManagement.homestayManagement.service.event;

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
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Component
public class PublicBookingConfirmationEmailListener {

    private static final Logger LOGGER = LoggerFactory.getLogger(PublicBookingConfirmationEmailListener.class);
    private static final DateTimeFormatter DATE_TIME_FORMAT = DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy");
    private static final Locale VIETNAM = Locale.forLanguageTag("vi-VN");
    private static final String HOMESTAY_ADDRESS = "Thung lũng Ngọc Linh, Trại Mới, Tiến Xuân, Thạch Thất, Hà Nội";
    private static final String CONTACT_PHONE = "0869 544 586 (Cô Hải)";

    private final JavaMailSender mailSender;
    private final String mailFrom;

    public PublicBookingConfirmationEmailListener(
            JavaMailSender mailSender,
            @Value("${app.mail.from}") String mailFrom
    ) {
        this.mailSender = mailSender;
        this.mailFrom = mailFrom;
    }

    @Async("mailTaskExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void sendPublicBookingConfirmationEmail(PublicBookingConfirmationEmailEvent event) {
        if (event.email() == null || event.email().isBlank()) {
            LOGGER.warn("Không thể gửi email xác nhận booking {} vì khách chưa nhập email", event.bookingCode());
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(mailFrom);
            helper.setTo(event.email());
            String subjectPrefix = event.paymentConfirmed() ? "Đã thanh toán booking " : "Xác nhận đặt phòng ";
            helper.setSubject(subjectPrefix + event.bookingCode() + " - Home Stays");
            helper.setText(buildPlainText(event), buildHtmlEmail(event));
            mailSender.send(message);
        } catch (MessagingException | RuntimeException exception) {
            LOGGER.error("Không thể gửi email xác nhận booking {}", event.bookingCode(), exception);
        }
    }

    private String buildPlainText(PublicBookingConfirmationEmailEvent event) {
        return """
                Xin chào %s,

                Home Stays đã ghi nhận đơn đặt phòng %s.
                Trạng thái thanh toán: %s.

                Nhận phòng: %s
                Trả phòng: %s

                Chi tiết phòng:
                %s
                Tiền phòng: %s
                Dịch vụ: %s
                Tổng tạm tính: %s
                %s

                Địa chỉ homestay:
                %s

                Liên hệ hỗ trợ:
                %s

                Vui lòng giữ lại mã booking để lễ tân hỗ trợ khi cần.

                Trân trọng,
                Home Stays
                """.formatted(
                event.fullName(),
                event.bookingCode(),
                event.paymentConfirmed() ? "Đã thanh toán" : "Chưa xác nhận thanh toán",
                formatDateTime(event.checkInTarget()),
                formatDateTime(event.checkOutTarget()),
                plainRoomLines(event),
                money(event.roomCharge()),
                money(event.serviceCharge()),
                money(event.totalAmount()),
                event.paymentConfirmed()
                        ? "Số tiền đã thanh toán: " + money(event.depositAmount())
                        : event.requiresDeposit()
                        ? "Số tiền cần thanh toán trước: " + money(event.depositAmount())
                        : "Trạng thái: Đặt phòng thành công",
                HOMESTAY_ADDRESS,
                CONTACT_PHONE
        );
    }

    private String buildHtmlEmail(PublicBookingConfirmationEmailEvent event) {
        String heading = event.paymentConfirmed() ? "Đã đặt phòng, đã thanh toán" : "Đã ghi nhận đặt phòng";
        String intro = event.paymentConfirmed()
                ? "Hệ thống đã xác nhận thanh toán cho booking của bạn."
                : "Cảm ơn bạn đã đặt phòng tại Home Stays.";
        String statusLabel = event.paymentConfirmed()
                ? "Đã đặt phòng, đã thanh toán"
                : event.requiresDeposit() ? "Đã đặt phòng, chờ thanh toán" : "Đặt phòng thành công";
        String statusAmount = event.paymentConfirmed()
                ? money(event.depositAmount())
                : event.requiresDeposit() ? money(event.depositAmount()) : money(event.totalAmount());
        String statusCaption = event.paymentConfirmed()
                ? "Số tiền đã thanh toán"
                : event.requiresDeposit() ? "Số tiền cần thanh toán trước" : "Tổng tạm tính";
        String statusBackground = event.paymentConfirmed() ? "#eaf7f0" : event.requiresDeposit() ? "#fff7e6" : "#eaf7f0";
        String statusColor = event.paymentConfirmed() ? "#15573a" : event.requiresDeposit() ? "#735314" : "#15573a";

        return """
                <!doctype html>
                <html lang="vi">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width,initial-scale=1">
                  <title>%s</title>
                </head>
                <body style="margin:0;padding:0;background:#f4f1ea;font-family:Arial,'Helvetica Neue',sans-serif;color:#1d332b;">
                  <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="background:#f4f1ea;">
                    <tr>
                      <td align="center" style="padding:28px 12px;">
                        <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 16px 44px rgba(29,51,43,.14);">
                          <tr>
                            <td style="padding:28px 34px;background:#15573f;color:#ffffff;">
                              <div style="font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:700;line-height:1;color:#ffffff;">Home Stays</div>
                              <div style="margin-top:18px;display:inline-block;padding:7px 11px;border-radius:999px;background:rgba(255,255,255,.14);color:#f4e7c3;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">Xác nhận booking</div>
                              <h1 style="margin:12px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:32px;line-height:1.2;font-weight:700;color:#ffffff;">%s</h1>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:30px 34px 8px;">
                              <p style="margin:0 0 10px;font-size:17px;line-height:1.65;color:#1d332b;">Xin chào <strong>%s</strong>,</p>
                              <p style="margin:0;color:#64736d;font-size:15px;line-height:1.7;">%s Vui lòng giữ lại mã booking dưới đây để lễ tân hỗ trợ khi cần.</p>
                              <div style="margin-top:20px;padding:18px 20px;border-radius:14px;background:%s;color:%s;">
                                <div style="font-size:12px;font-weight:900;letter-spacing:.7px;text-transform:uppercase;">%s</div>
                                <div style="margin-top:8px;font-size:28px;line-height:1;font-weight:900;">%s</div>
                                <div style="margin-top:6px;font-size:13px;font-weight:700;">%s</div>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:18px 34px;">
                              <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="border:1px solid #e1e7e3;border-radius:16px;background:#fbfcfb;overflow:hidden;">
                                <tr>
                                  <td style="padding:20px 20px 16px;border-bottom:1px solid #e1e7e3;">
                                    <div style="font-size:11px;letter-spacing:1.5px;color:#9a722a;font-weight:900;text-transform:uppercase;">Mã booking</div>
                                    <div style="margin-top:7px;font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:700;color:#15573f;word-break:break-word;">%s</div>
                                  </td>
                                </tr>
                                <tr>
                                  <td style="padding:18px 20px;">
                                    <table role="presentation" width="100%%" cellspacing="0" cellpadding="0">
                                      <tr>
                                        <td style="width:50%%;padding-right:10px;vertical-align:top;">
                                          <div style="font-size:12px;color:#7b8882;font-weight:800;">Nhận phòng</div>
                                          <div style="margin-top:6px;font-size:15px;color:#203b31;font-weight:800;">%s</div>
                                        </td>
                                        <td style="width:50%%;padding-left:10px;vertical-align:top;">
                                          <div style="font-size:12px;color:#7b8882;font-weight:800;">Trả phòng</div>
                                          <div style="margin-top:6px;font-size:15px;color:#203b31;font-weight:800;">%s</div>
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:0 34px 18px;">
                              <div style="font-size:15px;font-weight:900;color:#203b31;margin-bottom:8px;">Chi tiết phòng</div>
                              <div style="border:1px solid #e6ece8;border-radius:14px;overflow:hidden;background:#ffffff;">%s</div>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:0 34px 18px;">
                              <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#fbfcfb;border:1px solid #e6ece8;border-radius:14px;overflow:hidden;">
                                <tr><td style="padding:12px 16px;color:#64736d;">Tiền phòng</td><td align="right" style="padding:12px 16px;font-weight:800;color:#203b31;">%s</td></tr>
                                <tr><td style="padding:12px 16px;color:#64736d;border-top:1px solid #edf2ee;">Dịch vụ</td><td align="right" style="padding:12px 16px;font-weight:800;color:#203b31;border-top:1px solid #edf2ee;">%s</td></tr>
                                <tr><td style="padding:15px 16px;border-top:1px solid #dfe7e2;font-weight:900;color:#203b31;">Tổng tạm tính</td><td align="right" style="padding:15px 16px;border-top:1px solid #dfe7e2;font-size:21px;font-weight:900;color:#15573f;">%s</td></tr>
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:0 34px 30px;">
                              <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="border-radius:14px;background:#f6f1e6;border:1px solid #ebdfc8;">
                                <tr>
                                  <td style="padding:16px 18px;">
                                    <div style="font-size:12px;color:#9a722a;font-weight:900;text-transform:uppercase;letter-spacing:.8px;">Thông tin liên hệ</div>
                                    <div style="margin-top:9px;color:#203b31;font-size:14px;line-height:1.7;">
                                      <strong>Địa chỉ:</strong> %s<br>
                                      <strong>Điện thoại:</strong> %s
                                    </div>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td align="center" style="padding:20px 28px;background:#edf2ee;color:#73817b;font-size:12px;line-height:1.6;">
                              Cảm ơn bạn đã lựa chọn Home Stays.<br>
                              Hẹn gặp bạn tại Thung lũng Ngọc Linh.
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(
                escape(heading),
                escape(heading),
                escape(event.fullName()),
                escape(intro),
                statusBackground,
                statusColor,
                escape(statusLabel),
                escape(statusAmount),
                escape(statusCaption),
                escape(event.bookingCode()),
                escape(formatDateTime(event.checkInTarget())),
                escape(formatDateTime(event.checkOutTarget())),
                buildRoomRows(event),
                escape(money(event.roomCharge())),
                escape(money(event.serviceCharge())),
                escape(money(event.totalAmount())),
                escape(HOMESTAY_ADDRESS),
                escape(CONTACT_PHONE)
        );
    }

    private String buildRoomRows(PublicBookingConfirmationEmailEvent event) {
        StringBuilder rows = new StringBuilder();
        for (PublicBookingConfirmationEmailEvent.RoomLine room : event.rooms()) {
            rows.append("""
                    <div style="padding:14px 16px;border-bottom:1px solid #edf2ee;">
                      <div style="font-weight:900;color:#203b31;font-size:15px;">%s</div>
                      <div style="margin-top:5px;color:#64736d;font-size:13px;line-height:1.6;">%s người lớn, %s trẻ em</div>
                      <div style="margin-top:6px;color:#15573f;font-size:14px;font-weight:900;">%s</div>
                    </div>
                    """.formatted(
                    escape(room.roomTypeName()),
                    room.numberOfAdults() == null ? 0 : room.numberOfAdults(),
                    room.numberOfChildren() == null ? 0 : room.numberOfChildren(),
                    escape(money(room.finalRoomAmount()))
            ));
        }
        return rows.toString();
    }

    private String plainRoomLines(PublicBookingConfirmationEmailEvent event) {
        StringBuilder lines = new StringBuilder();
        for (PublicBookingConfirmationEmailEvent.RoomLine room : event.rooms()) {
            lines.append("- ")
                    .append(room.roomTypeName())
                    .append(": ")
                    .append(room.numberOfAdults() == null ? 0 : room.numberOfAdults())
                    .append(" người lớn, ")
                    .append(room.numberOfChildren() == null ? 0 : room.numberOfChildren())
                    .append(" trẻ em - ")
                    .append(money(room.finalRoomAmount()))
                    .append("\n");
        }
        return lines.toString();
    }

    private String formatDateTime(java.time.LocalDateTime value) {
        return value == null ? "Chưa xác định" : value.format(DATE_TIME_FORMAT);
    }

    private String money(BigDecimal value) {
        return NumberFormat.getCurrencyInstance(VIETNAM).format(value == null ? BigDecimal.ZERO : value);
    }

    private String escape(String value) {
        return HtmlUtils.htmlEscape(value == null ? "" : value);
    }
}
