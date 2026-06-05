package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.request.ForgotPasswordRequest;
import com.homestayManagement.homestayManagement.dto.request.ResetPasswordRequest;
import com.homestayManagement.homestayManagement.dto.request.VerifyOtpRequest;
import com.homestayManagement.homestayManagement.entity.PasswordResetToken;
import com.homestayManagement.homestayManagement.entity.User;
import com.homestayManagement.homestayManagement.repository.PasswordResetTokenRepository;
import com.homestayManagement.homestayManagement.repository.UserRepository;
import com.homestayManagement.homestayManagement.service.PasswordResetService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
public class PasswordResetServiceImpl implements PasswordResetService {

    private static final int OTP_LENGTH = 6;
    private static final int OTP_EXPIRY_MINUTES = 3;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final JavaMailSender mailSender;
    private final PasswordEncoder passwordEncoder;
    private final String mailFrom;

    public PasswordResetServiceImpl(
            UserRepository userRepository,
            PasswordResetTokenRepository tokenRepository,
            JavaMailSender mailSender,
            PasswordEncoder passwordEncoder,
            @Value("${app.mail.from}") String mailFrom
    ) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.mailSender = mailSender;
        this.passwordEncoder = passwordEncoder;
        this.mailFrom = mailFrom;
    }

    @Override
    @Transactional
    public void sendOtp(ForgotPasswordRequest request) {
        // Không tiết lộ email có tồn tại hay không để bảo mật
        if (!userRepository.existsByEmail(request.email())) {
            return;
        }

        // Xóa OTP cũ trước khi tạo mới
        tokenRepository.deleteAllByEmail(request.email());

        String otp = generateOtp();

        PasswordResetToken token = PasswordResetToken.builder()
                .email(request.email())
                .otp(otp)
                .expiresAt(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES))
                .build();

        tokenRepository.save(token);
        sendOtpEmail(request.email(), otp);
    }

    @Override
    public void verifyOtp(VerifyOtpRequest request) {
        PasswordResetToken token = getValidToken(request.email(), request.otp());

        if (token == null) {
            throw new IllegalArgumentException("Mã OTP không đúng hoặc đã hết hạn");
        }
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken token = getValidToken(request.email(), request.otp());

        if (token == null) {
            throw new IllegalArgumentException("Mã OTP không đúng hoặc đã hết hạn");
        }

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài khoản"));

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        // Xóa token sau khi dùng
        tokenRepository.deleteAllByEmail(request.email());
    }

    // Lấy token hợp lệ: đúng OTP, chưa hết hạn, chưa dùng
    private PasswordResetToken getValidToken(String email, String otp) {
        return tokenRepository.findTopByEmailOrderByExpiresAtDesc(email)
                .filter(t -> !t.isUsed())
                .filter(t -> t.getExpiresAt().isAfter(LocalDateTime.now()))
                .filter(t -> t.getOtp().equals(otp))
                .orElse(null);
    }

    private String generateOtp() {
        int code = SECURE_RANDOM.nextInt(900000) + 100000; // 100000 - 999999
        return String.valueOf(code);
    }

    private void sendOtpEmail(String toEmail, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailFrom);
        message.setTo(toEmail);
        message.setSubject("Mã xác nhận đặt lại mật khẩu - Home Stays");
        message.setText(
                "Xin chào,\n\n" +
                "Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản Home Stays.\n\n" +
                "Mã OTP của bạn là: " + otp + "\n\n" +
                "Mã có hiệu lực trong " + OTP_EXPIRY_MINUTES + " phút.\n" +
                "Nếu bạn không yêu cầu điều này, hãy bỏ qua email này.\n\n" +
                "Trân trọng,\nHome Stays"
        );
        mailSender.send(message);
    }
}
