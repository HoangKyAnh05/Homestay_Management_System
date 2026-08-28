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

import java.time.format.DateTimeFormatter;

@Component
public class StayAccessEmailListener {

    private static final Logger LOGGER = LoggerFactory.getLogger(StayAccessEmailListener.class);
    private static final DateTimeFormatter DATE_TIME_FORMAT =
            DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy");

    private final JavaMailSender mailSender;
    private final String mailFrom;
    private final String frontendBaseUrl;

    public StayAccessEmailListener(
            JavaMailSender mailSender,
            @Value("${app.mail.from}") String mailFrom,
            @Value("${app.frontend.base-url:http://localhost:5173}") String frontendBaseUrl
    ) {
        this.mailSender = mailSender;
        this.mailFrom = mailFrom;
        this.frontendBaseUrl = frontendBaseUrl.replaceAll("/+$", "");
    }

    @Async("mailTaskExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void sendStayAccessEmail(StayAccessEmailEvent event) {
        try {
            String actionUrl = event.activationRequired()
                    ? frontendBaseUrl + "/stay/activate?token=" + event.activationToken()
                    : frontendBaseUrl + "/stay";
            String actionText = event.activationRequired()
                    ? "Đặt mật khẩu và kích hoạt tài khoản"
                    : "Mở trang dịch vụ lưu trú";
            String checkoutText = event.checkOutTarget() != null
                    ? event.checkOutTarget().format(DATE_TIME_FORMAT)
                    : "Chưa xác định";
            String plainText = """
                    Xin chào %s,

                    Bạn đã được cấp quyền truy cập dịch vụ cho phòng %s, booking %s.
                    Quyền truy cập có hiệu lực đến khi phòng hoàn tất checkout.
                    Thời gian trả phòng dự kiến: %s.

                    %s:
                    %s

                    Không chia sẻ đường dẫn kích hoạt hoặc thông tin đăng nhập với người khác.

                    Trân trọng,
                    Home Stays
                    """.formatted(
                    event.representativeName(),
                    event.roomNumber(),
                    event.bookingCode(),
                    checkoutText,
                    actionText,
                    actionUrl
            );

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(mailFrom);
            helper.setTo(event.email());
            helper.setSubject("Chào mừng bạn đến phòng " + event.roomNumber() + " - Home Stays");
            helper.setText(plainText, buildHtmlEmail(event, actionText, actionUrl, checkoutText));
            mailSender.send(message);
        } catch (MessagingException | RuntimeException exception) {
            LOGGER.error("Không thể gửi email quyền lưu trú tới {}", event.email(), exception);
        }
    }

    private String buildHtmlEmail(
            StayAccessEmailEvent event,
            String actionText,
            String actionUrl,
            String checkoutText
    ) {
        String name = escape(event.representativeName());
        String room = escape(event.roomNumber());
        String booking = escape(event.bookingCode());
        String checkout = escape(checkoutText);
        String buttonText = escape(actionText);
        String safeUrl = escape(actionUrl);
        String activationNote = event.activationRequired()
                ? "Liên kết kích hoạt chỉ sử dụng một lần và có hiệu lực trong 24 giờ."
                : "Tài khoản hiện tại của bạn đã được cấp thêm quyền truy cập cho phòng này.";

        return """
                <!doctype html>
                <html lang="vi">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width,initial-scale=1">
                  <title>Quyền truy cập lưu trú</title>
                </head>
                <body style="margin:0;padding:0;background:#f3f1ea;font-family:Arial,'Helvetica Neue',sans-serif;color:#1d332b;">
                  <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="background:#f3f1ea;">
                    <tr>
                      <td align="center" style="padding:28px 14px;">
                        <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 18px 50px rgba(20,66,49,.12);">
                          <tr>
                            <td style="padding:34px 36px;background:#174f3b;color:#ffffff;">
                              <div style="font-family:Georgia,serif;font-size:27px;font-weight:700;color:#ffffff;">Home Stays</div>
                              <div style="margin-top:18px;font-size:11px;font-weight:700;letter-spacing:2px;color:#e2bd70;">CHÀO MỪNG BẠN ĐẾN LƯU TRÚ</div>
                              <h1 style="margin:8px 0 0;font-family:Georgia,serif;font-size:34px;line-height:1.15;font-weight:700;">Phòng của bạn đã sẵn sàng</h1>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:34px 36px 12px;">
                              <p style="margin:0 0 10px;font-size:17px;line-height:1.65;">Xin chào <strong>%s</strong>,</p>
                              <p style="margin:0;color:#65736d;font-size:15px;line-height:1.7;">Bạn đã được cấp quyền truy cập trang dịch vụ trong thời gian lưu trú. Từ đây bạn có thể xem thông tin phòng, gọi tiện ích và theo dõi các dịch vụ đã sử dụng.</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:18px 36px;">
                              <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="border:1px solid #e2e8e3;border-radius:18px;background:#f8faf8;">
                                <tr>
                                  <td style="padding:20px;border-bottom:1px solid #e2e8e3;">
                                    <div style="font-size:11px;letter-spacing:1.4px;color:#9a722a;font-weight:700;">PHÒNG LƯU TRÚ</div>
                                    <div style="margin-top:5px;font-family:Georgia,serif;font-size:28px;font-weight:700;color:#174f3b;">Phòng %s</div>
                                  </td>
                                </tr>
                                <tr>
                                  <td style="padding:18px 20px;">
                                    <table role="presentation" width="100%%" cellspacing="0" cellpadding="0">
                                      <tr>
                                        <td style="width:50%%;padding-right:10px;vertical-align:top;">
                                          <div style="font-size:11px;color:#8a948f;">MÃ ĐẶT PHÒNG</div>
                                          <div style="margin-top:5px;font-size:14px;font-weight:700;color:#263f35;">%s</div>
                                        </td>
                                        <td style="width:50%%;padding-left:10px;vertical-align:top;">
                                          <div style="font-size:11px;color:#8a948f;">TRẢ PHÒNG DỰ KIẾN</div>
                                          <div style="margin-top:5px;font-size:14px;font-weight:700;color:#263f35;">%s</div>
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td align="center" style="padding:10px 36px 18px;">
                              <a href="%s" style="display:block;padding:16px 22px;border-radius:14px;background:#174f3b;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;">%s&nbsp;&nbsp;→</a>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:0 36px 34px;">
                              <div style="padding:14px 16px;border-radius:13px;background:#fff7e6;color:#79581d;font-size:12px;line-height:1.6;">🔒 %s Không chia sẻ đường dẫn hoặc thông tin đăng nhập với người khác.</div>
                            </td>
                          </tr>
                          <tr>
                            <td align="center" style="padding:22px 30px;background:#edf2ee;color:#75817b;font-size:12px;line-height:1.6;">
                              Cần hỗ trợ? Hãy liên hệ lễ tân Home Stays.<br>
                              © 2026 Home Stays · Một kỳ nghỉ nhẹ nhàng hơn.
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(
                name,
                room,
                booking,
                checkout,
                safeUrl,
                buttonText,
                escape(activationNote)
        );
    }

    private String escape(String value) {
        return HtmlUtils.htmlEscape(value == null ? "" : value);
    }
}
