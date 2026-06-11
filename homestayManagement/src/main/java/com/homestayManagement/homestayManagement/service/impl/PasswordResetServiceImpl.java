package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.request.ForgotPasswordRequest;
import com.homestayManagement.homestayManagement.dto.request.ResetPasswordRequest;
import com.homestayManagement.homestayManagement.dto.request.VerifyOtpRequest;
import com.homestayManagement.homestayManagement.entity.Account;
import com.homestayManagement.homestayManagement.repository.AccountRepository;
import com.homestayManagement.homestayManagement.repository.OtpTokenRepository;
import com.homestayManagement.homestayManagement.repository.OtpTokenRepository.OtpToken;
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
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailFrom);
        message.setTo(toEmail);
        message.setSubject("Ma xac nhan dat lai mat khau - Home Stays");
        message.setText(
                "Xin chao,\n\n" +
                "Ban da yeu cau dat lai mat khau cho tai khoan Home Stays.\n\n" +
                "Ma OTP cua ban la: " + otp + "\n\n" +
                "Ma co hieu luc trong " + OTP_EXPIRY_MINUTES + " phut.\n" +
                "Neu ban khong yeu cau dieu nay, hay bo qua email nay.\n\n" +
                "Tran trong,\nHome Stays"
        );
        mailSender.send(message);
    }
}
