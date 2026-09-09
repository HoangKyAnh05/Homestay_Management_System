package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.request.ForgotPasswordRequest;
import com.homestayManagement.homestayManagement.dto.request.ResetPasswordRequest;
import com.homestayManagement.homestayManagement.dto.request.VerifyOtpRequest;
import com.homestayManagement.homestayManagement.entity.Account;
import com.homestayManagement.homestayManagement.repository.AccountRepository;
import com.homestayManagement.homestayManagement.repository.OtpTokenRepository;
import com.homestayManagement.homestayManagement.repository.OtpTokenRepository.OtpToken;
import com.homestayManagement.homestayManagement.service.PasswordResetService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
public class PasswordResetServiceImpl implements PasswordResetService {

    private static final Logger LOGGER = LoggerFactory.getLogger(PasswordResetServiceImpl.class);
    private static final int OTP_EXPIRY_MINUTES = 3;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final AccountRepository accountRepository;
    private final OtpTokenRepository tokenRepository;
    private final JavaMailSender mailSender;
    private final PasswordEncoder passwordEncoder;
    private final String mailFrom;

    public PasswordResetServiceImpl(
            AccountRepository accountRepository,
            OtpTokenRepository tokenRepository,
            JavaMailSender mailSender,
            PasswordEncoder passwordEncoder,
            @Value("${app.mail.from}") String mailFrom
    ) {
        this.accountRepository = accountRepository;
        this.tokenRepository = tokenRepository;
        this.mailSender = mailSender;
        this.passwordEncoder = passwordEncoder;
        this.mailFrom = mailFrom;
    }

    @Override
    @Transactional
    public void sendOtp(ForgotPasswordRequest request) {
        if (!accountRepository.existsByEmail(request.email())) {
            return;
        }

        tokenRepository.deleteAllByEmail(request.email());

        String otp = generateOtp();

        OtpToken token = OtpToken.builder()
                .email(request.email())
                .otp(otp)
                .expiresAt(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES))
                .build();

        tokenRepository.save(token);
        sendOtpEmail(request.email(), otp);
    }

    @Override
    public void verifyOtp(VerifyOtpRequest request) {
        OtpToken token = getValidToken(request.email(), request.otp());

        if (token == null) {
            throw new IllegalArgumentException("Ma OTP khong dung hoac da het han");
        }
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        OtpToken token = getValidToken(request.email(), request.otp());

        if (token == null) {
            throw new IllegalArgumentException("Ma OTP khong dung hoac da het han");
        }

        Account account = accountRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay tai khoan"));

        account.setPassword(passwordEncoder.encode(request.newPassword()));
        accountRepository.save(account);

        tokenRepository.deleteAllByEmail(request.email());
    }

    private OtpToken getValidToken(String email, String otp) {
        return tokenRepository.findTopByEmailOrderByExpiresAtDesc(email)
                .filter(t -> !t.isUsed())
                .filter(t -> t.getExpiresAt().isAfter(LocalDateTime.now()))
                .filter(t -> t.getOtp().equals(otp))
                .orElse(null);
    }

    private String generateOtp() {
        int code = SECURE_RANDOM.nextInt(900000) + 100000;
        return String.valueOf(code);
    }

    private void sendOtpEmail(String toEmail, String otp) {
        String subject = "Mã xác nhận đặt lại mật khẩu - Lá Đỏ Homestay";
        String plainText = """
                Xin chào,

                Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản tại Lá Đỏ Homestay.

                Mã OTP của bạn là: %s

                Mã xác thực có hiệu lực trong %d phút.
                Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này để bảo vệ tài khoản của bạn.

                Trân trọng,
                Lá Đỏ Homestay
                """.formatted(otp, OTP_EXPIRY_MINUTES);

        String htmlText = """
                <!DOCTYPE html>
                <html lang="vi">
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; color: #333333; }
                        .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); border: 1px solid #e5e7eb; }
                        .header { background: #15573a; padding: 24px; text-align: center; color: #ffffff; }
                        .header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px; }
                        .body { padding: 32px 28px; line-height: 1.6; }
                        .body p { margin: 0 0 16px; font-size: 15px; }
                        .otp-box { margin: 24px 0; padding: 20px; background: #f0fdf4; border: 2px dashed #15573a; border-radius: 10px; text-align: center; }
                        .otp-code { font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #15573a; font-family: monospace, sans-serif; }
                        .otp-hint { font-size: 13px; color: #6b7280; margin-top: 8px; }
                        .footer { background: #f9fafb; padding: 20px 28px; text-align: center; font-size: 13px; color: #6b7280; border-top: 1px solid #f3f4f6; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>LÁ ĐỎ HOMESTAY</h1>
                        </div>
                        <div class="body">
                            <p>Xin chào,</p>
                            <p>Bạn vừa gửi yêu cầu đặt lại mật khẩu cho tài khoản tại <strong>Lá Đỏ Homestay</strong>.</p>
                            <div class="otp-box">
                                <div class="otp-code">%s</div>
                                <div class="otp-hint">Mã xác thực có hiệu lực trong <strong>%d phút</strong></div>
                            </div>
                            <p style="color: #64748b; font-size: 14px;">Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này để đảm bảo an toàn cho tài khoản của bạn.</p>
                            <p style="margin-top: 24px;">Trân trọng,<br><strong>Đội ngũ Lá Đỏ Homestay</strong></p>
                        </div>
                        <div class="footer">
                            Email tự động từ hệ thống quản lý Lá Đỏ Homestay Sa Pa.<br>Vui lòng không trả lời email này.
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(otp, OTP_EXPIRY_MINUTES);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(mailFrom);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(plainText, htmlText);
            mailSender.send(message);
        } catch (MessagingException | RuntimeException e) {
            LOGGER.error("Không thể gửi email OTP đặt lại mật khẩu tới {}", toEmail, e);
            throw new RuntimeException("Không thể gửi email xác thực. Vui lòng thử lại sau.");
        }
    }
}
