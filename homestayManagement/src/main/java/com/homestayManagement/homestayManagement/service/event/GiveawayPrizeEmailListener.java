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
public class GiveawayPrizeEmailListener {

    private static final Logger LOGGER = LoggerFactory.getLogger(GiveawayPrizeEmailListener.class);
    private static final DateTimeFormatter DATE_TIME_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final String HOMESTAY_NAME = "Lá Đỏ Homestay Sa Pa";
    private static final String HOMESTAY_ADDRESS = "Đường Fansipan / Hoàng Liên, Phường Sa Pa, Thị xã Sa Pa, Lào Cai";
    private static final String CONTACT_PHONE = "0941 186 699 - 0981 123 456";

    private final JavaMailSender mailSender;
    private final String mailFrom;
    private final String publicBaseUrl;

    public GiveawayPrizeEmailListener(
            JavaMailSender mailSender,
            @Value("${app.mail.from}") String mailFrom,
            @Value("${app.public-base-url:https://homestay-sapa.myvnc.com}") String publicBaseUrl
    ) {
        this.mailSender = mailSender;
        this.mailFrom = mailFrom;
        this.publicBaseUrl = publicBaseUrl;
    }

    @Async("mailTaskExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleGiveawayPrizeEmail(GiveawayPrizeEmailEvent event) {
        if (event.email() == null || event.email().isBlank()) {
            LOGGER.warn("Không thể gửi email xác nhận giải thưởng vòng quay vì khách hàng chưa nhập email");
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(mailFrom);
            helper.setTo(event.email());
            helper.setSubject("[" + HOMESTAY_NAME + "] Bằng chứng xác nhận trúng thưởng Vòng quay may mắn - Mã: " + event.prizeCode());
            helper.setText(buildPlainText(event), buildHtmlEmail(event));
            mailSender.send(message);
            LOGGER.info("Đã gửi email xác nhận trúng thưởng thành công tới: {} với mã: {}", event.email(), event.prizeCode());
        } catch (MessagingException | RuntimeException exception) {
            LOGGER.error("Không thể gửi email xác nhận trúng thưởng cho mã {}", event.prizeCode(), exception);
        }
    }

    private String buildPlainText(GiveawayPrizeEmailEvent event) {
        String expiryText = event.expiryDate() != null
                ? event.expiryDate().format(DATE_TIME_FORMAT)
                : "Trong vòng 30 ngày kể từ lúc nhận";

        return """
                Xin chào %s,

                Chúc mừng bạn đã tham gia Vòng quay may mắn tại Lá Đỏ Homestay Sa Pa và trúng phần thưởng giá trị!

                --- CHI TIẾT PHẦN THƯỞNG (BẰNG CHỨNG XÁC NHẬN) ---
                - Khách hàng: %s (SĐT: %s)
                - Giải thưởng: %s
                - Mã Voucher ưu đãi: %s
                - Mức ưu đãi: %s
                - Hạn sử dụng: %s

                --- HƯỚNG DẪN SỬ DỤNG PHẦN THƯỞNG ---
                1. Đặt phòng trực tuyến tại website: %s/rooms (Nhập mã voucher %s khi thanh toán).
                2. Hoặc liên hệ Hotline/Zalo: %s và đọc mã voucher để nhân viên áp dụng ngay cho bạn.
                3. Email này là bằng chứng xác nhận chính thức để nhận ưu đãi từ Lá Đỏ Homestay Sa Pa.

                Địa chỉ homestay: %s
                Hotline hỗ trợ: %s

                Trân trọng cảm ơn và hẹn sớm đón tiếp bạn tại thiên đường mây Sa Pa!
                Lá Đỏ Homestay Sa Pa
                """.formatted(
                event.fullName(),
                event.fullName(),
                event.phone(),
                event.prizeName(),
                event.prizeCode(),
                event.discountPercent() > 0 ? "Giảm giá " + event.discountPercent() + "%" : "Quà tặng đặc biệt từ homestay",
                expiryText,
                publicBaseUrl,
                event.prizeCode(),
                CONTACT_PHONE,
                HOMESTAY_ADDRESS,
                CONTACT_PHONE
        );
    }

    private String buildHtmlEmail(GiveawayPrizeEmailEvent event) {
        String expiryText = event.expiryDate() != null
                ? event.expiryDate().format(DATE_TIME_FORMAT)
                : "Trong vòng 30 ngày kể từ lúc nhận";

        String discountBadge = event.discountPercent() > 0
                ? "GIẢM GIÁ " + event.discountPercent() + "%"
                : "QUÀ TẶNG ĐẶC BIỆT";

        String bookingLink = publicBaseUrl != null && !publicBaseUrl.isBlank()
                ? publicBaseUrl + "/rooms"
                : "https://homestay-sapa.myvnc.com/rooms";

        return """
                <!doctype html>
                <html lang="vi">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width,initial-scale=1">
                  <title>Xác nhận trúng thưởng Vòng quay may mắn - Lá Đỏ Homestay</title>
                </head>
                <body style="margin:0;padding:0;background:#181513;font-family:Arial,'Helvetica Neue',sans-serif;color:#e7e5e4;">
                  <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="background:#181513;">
                    <tr>
                      <td align="center" style="padding:32px 12px;">
                        <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#241f1c;border-radius:20px;overflow:hidden;border:1px solid #44372e;box-shadow:0 20px 50px rgba(0,0,0,.6);">
                          <!-- Header -->
                          <tr>
                            <td style="padding:32px 34px;background:linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #450a0a 100%);color:#ffffff;text-align:center;border-bottom:2px solid #f59e0b;">
                              <div style="display:inline-block;padding:6px 14px;border-radius:999px;background:rgba(254,240,138,.15);border:1px solid rgba(254,240,138,.35);color:#fef08a;font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:12px;">
                                🍁 BẰNG CHỨNG XÁC NHẬN TRÚNG THƯỞNG
                              </div>
                              <div style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:700;line-height:1.2;color:#ffffff;margin-bottom:4px;">
                                %s
                              </div>
                              <h1 style="margin:10px 0 0;font-size:20px;line-height:1.3;font-weight:700;color:#fef08a;">
                                Vòng Quay May Mắn • Săn Mây Sa Pa
                              </h1>
                            </td>
                          </tr>

                          <!-- Body -->
                          <tr>
                            <td style="padding:30px 32px 12px;">
                              <p style="margin:0 0 12px;font-size:16px;line-height:1.6;color:#f5f5f4;">
                                Xin chào <strong>%s</strong>,
                              </p>
                              <p style="margin:0;color:#d6d3d1;font-size:15px;line-height:1.7;">
                                Chúc mừng bạn đã tham gia Vòng quay may mắn tại <strong>Lá Đỏ Homestay Sa Pa</strong> và xuất sắc trúng phần thưởng giá trị dưới đây. Email này có giá trị xác nhận và làm <strong>bằng chứng chính thức</strong> để quý khách nhận quà khi đặt phòng!
                              </p>
                            </td>
                          </tr>

                          <!-- Prize Card -->
                          <tr>
                            <td style="padding:10px 32px 20px;">
                              <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="border:2px dashed #f59e0b;border-radius:16px;background:linear-gradient(135deg, rgba(185,28,28,0.18) 0%, rgba(217,119,6,0.18) 100%%);overflow:hidden;">
                                <tr>
                                  <td style="padding:22px;text-align:center;">
                                    <div style="display:inline-block;padding:4px 12px;border-radius:999px;background:#f59e0b;color:#1c1917;font-size:11px;font-weight:900;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">
                                      %s
                                    </div>
                                    <div style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:700;color:#fef08a;margin-bottom:16px;">
                                      %s
                                    </div>

                                    <!-- Voucher Box -->
                                    <div style="background:#14110f;padding:14px 20px;border-radius:12px;border:1px solid #78350f;margin:0 auto 14px;max-width:320px;">
                                      <div style="font-size:11px;color:#a8a29e;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">
                                        MÃ VOUCHER NHẬN THƯỞNG
                                      </div>
                                      <div style="font-family:monospace,'Courier New',Courier;font-size:26px;font-weight:800;color:#38bdf8;letter-spacing:2px;">
                                        %s
                                      </div>
                                    </div>

                                    <div style="font-size:13px;color:#fecdd3;font-weight:600;">
                                      ⏳ Hạn sử dụng: <strong>%s</strong> (30 ngày kể từ khi quay)
                                    </div>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>

                          <!-- Information Table -->
                          <tr>
                            <td style="padding:0 32px 20px;">
                              <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#1b1715;border:1px solid #382f28;border-radius:12px;overflow:hidden;font-size:14px;">
                                <tr>
                                  <td style="padding:10px 16px;color:#a8a29e;border-bottom:1px solid #2e2621;width:35%%;">Họ và tên:</td>
                                  <td style="padding:10px 16px;color:#ffffff;font-weight:700;border-bottom:1px solid #2e2621;">%s</td>
                                </tr>
                                <tr>
                                  <td style="padding:10px 16px;color:#a8a29e;border-bottom:1px solid #2e2621;">Số điện thoại:</td>
                                  <td style="padding:10px 16px;color:#ffffff;font-weight:700;border-bottom:1px solid #2e2621;">%s</td>
                                </tr>
                                <tr>
                                  <td style="padding:10px 16px;color:#a8a29e;">Email nhận bằng chứng:</td>
                                  <td style="padding:10px 16px;color:#38bdf8;font-weight:700;">%s</td>
                                </tr>
                              </table>
                            </td>
                          </tr>

                          <!-- How to Redeem -->
                          <tr>
                            <td style="padding:0 32px 24px;">
                              <div style="background:#201b18;border-left:4px solid #10b981;border-radius:8px;padding:16px 18px;">
                                <div style="font-size:13px;color:#6ee7b7;font-weight:800;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:8px;">
                                  📌 HƯỚNG DẪN SỬ DỤNG MÃ ƯU ĐÃI:
                                </div>
                                <div style="color:#d6d3d1;font-size:13.5px;line-height:1.65;">
                                  1. <strong>Đặt phòng trực tuyến:</strong> Bấm nút bên dưới để chọn phòng và nhập mã <strong>%s</strong> tại bước đặt phòng.<br>
                                  2. <strong>Liên hệ trực tiếp:</strong> Gọi điện hoặc nhắn tin Zalo cho homestay, cung cấp mã voucher để được giảm trừ trực tiếp.<br>
                                  3. <strong>Bằng chứng nhận giải:</strong> Xuất trình email này tại quầy lễ tân khi làm thủ tục check-in.
                                </div>
                              </div>
                            </td>
                          </tr>

                          <!-- CTA Buttons -->
                          <tr>
                            <td style="padding:0 32px 30px;text-align:center;">
                              <a href="%s" style="display:inline-block;padding:14px 28px;border-radius:12px;background:linear-gradient(135deg, #e11d48 0%, #be123c 100%%);color:#ffffff;font-weight:800;font-size:15px;text-decoration:none;box-shadow:0 6px 20px rgba(225,29,72,0.45);margin-bottom:10px;">
                                🚀 ĐẶT PHÒNG & ÁP DỤNG MÃ NGAY
                              </a>
                              <div style="font-size:13px;color:#a8a29e;margin-top:6px;">
                                Hoặc gọi Hotline hỗ trợ 24/7: <strong style="color:#fef08a;">%s</strong>
                              </div>
                            </td>
                          </tr>

                          <!-- Footer -->
                          <tr>
                            <td style="padding:22px 30px;background:#14110f;color:#78716c;font-size:12px;line-height:1.6;text-align:center;border-top:1px solid #2e2621;">
                              <strong>Lá Đỏ Homestay Sa Pa</strong><br>
                              Địa chỉ: %s<br>
                              Điện thoại / Zalo: %s<br>
                              <span style="color:#57534e;">Chúc bạn có kỳ nghỉ tuyệt vời và nhiều kỷ niệm đẹp tại Sa Pa!</span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(
                escape(HOMESTAY_NAME),
                escape(event.fullName()),
                discountBadge,
                escape(event.prizeName()),
                escape(event.prizeCode()),
                escape(expiryText),
                escape(event.fullName()),
                escape(event.phone()),
                escape(event.email()),
                escape(event.prizeCode()),
                escape(bookingLink),
                escape(CONTACT_PHONE),
                escape(HOMESTAY_ADDRESS),
                escape(CONTACT_PHONE)
        );
    }

    private String escape(String value) {
        return HtmlUtils.htmlEscape(value == null ? "" : value);
    }
}
