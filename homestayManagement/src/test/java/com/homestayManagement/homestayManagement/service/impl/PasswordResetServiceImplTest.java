package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.request.ForgotPasswordRequest;
import com.homestayManagement.homestayManagement.dto.request.ResetPasswordRequest;
import com.homestayManagement.homestayManagement.dto.request.VerifyOtpRequest;
import com.homestayManagement.homestayManagement.entity.Account;
import com.homestayManagement.homestayManagement.repository.AccountRepository;
import com.homestayManagement.homestayManagement.repository.OtpTokenRepository;
import com.homestayManagement.homestayManagement.repository.OtpTokenRepository.OtpToken;
import com.homestayManagement.homestayManagement.security.OtpLockedException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceImplTest {

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private OtpTokenRepository tokenRepository;

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private PasswordEncoder passwordEncoder;

    private PasswordResetServiceImpl passwordResetService;

    @BeforeEach
    void setUp() {
        passwordResetService = new PasswordResetServiceImpl(
                accountRepository,
                tokenRepository,
                mailSender,
                passwordEncoder,
                "noreply@homestay.local"
        );
    }

    @Test
    void verifyOtp_ThrowsIllegalArgumentException_WhenOtpWrongLessThan5Times() {
        String email = "test@example.com";
        OtpToken token = OtpToken.builder()
                .email(email)
                .otp("123456")
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .failedAttempts(0)
                .build();

        when(tokenRepository.findTopByEmailOrderByExpiresAtDesc(email)).thenReturn(Optional.of(token));

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> passwordResetService.verifyOtp(new VerifyOtpRequest(email, "654321"))
        );

        assertTrue(exception.getMessage().contains("Bạn còn 4 lần thử"));
        assertEquals(1, token.getFailedAttempts());
        assertFalse(token.isLocked());
        verify(tokenRepository).save(token);
    }

    @Test
    void verifyOtp_ThrowsOtpLockedException_WhenOtpWrong5Times() {
        String email = "test@example.com";
        OtpToken token = OtpToken.builder()
                .email(email)
                .otp("123456")
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .failedAttempts(4)
                .build();

        when(tokenRepository.findTopByEmailOrderByExpiresAtDesc(email)).thenReturn(Optional.of(token));

        OtpLockedException exception = assertThrows(
                OtpLockedException.class,
                () -> passwordResetService.verifyOtp(new VerifyOtpRequest(email, "999999"))
        );

        assertTrue(exception.getMessage().contains("Mã OTP đã bị khóa do nhập sai quá 5 lần"));
        assertEquals(5, token.getFailedAttempts());
        assertTrue(token.isLocked());
        verify(tokenRepository).save(token);
    }

    @Test
    void verifyOtp_ThrowsOtpLockedException_WhenTokenAlreadyLockedEvenWithCorrectOtp() {
        String email = "test@example.com";
        OtpToken token = OtpToken.builder()
                .email(email)
                .otp("123456")
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .locked(true)
                .failedAttempts(5)
                .build();

        when(tokenRepository.findTopByEmailOrderByExpiresAtDesc(email)).thenReturn(Optional.of(token));

        OtpLockedException exception = assertThrows(
                OtpLockedException.class,
                () -> passwordResetService.verifyOtp(new VerifyOtpRequest(email, "123456"))
        );

        assertTrue(exception.getMessage().contains("Mã OTP đã bị khóa do nhập sai quá 5 lần"));
    }

    @Test
    void verifyOtp_Success_WhenOtpIsCorrect() {
        String email = "test@example.com";
        OtpToken token = OtpToken.builder()
                .email(email)
                .otp("123456")
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .failedAttempts(2)
                .build();

        when(tokenRepository.findTopByEmailOrderByExpiresAtDesc(email)).thenReturn(Optional.of(token));

        assertDoesNotThrow(() -> passwordResetService.verifyOtp(new VerifyOtpRequest(email, "123456")));
        assertEquals(2, token.getFailedAttempts());
        assertFalse(token.isLocked());
    }

    @Test
    void resetPassword_ThrowsOtpLockedException_WhenOtpWrong5Times() {
        String email = "test@example.com";
        OtpToken token = OtpToken.builder()
                .email(email)
                .otp("123456")
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .failedAttempts(4)
                .build();

        when(tokenRepository.findTopByEmailOrderByExpiresAtDesc(email)).thenReturn(Optional.of(token));

        OtpLockedException exception = assertThrows(
                OtpLockedException.class,
                () -> passwordResetService.resetPassword(new ResetPasswordRequest(email, "000000", "NewPass123!"))
        );
        assertTrue(exception.getMessage().contains("Mã OTP đã bị khóa do nhập sai quá 5 lần"));
        assertTrue(token.isLocked());
        verify(tokenRepository).save(token);
        verify(accountRepository, never()).save(any());
    }

    @Test
    void resetPassword_ThrowsOtpLockedException_WhenTokenAlreadyLockedEvenWithCorrectOtp() {
        String email = "test@example.com";
        OtpToken token = OtpToken.builder()
                .email(email)
                .otp("123456")
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .locked(true)
                .failedAttempts(5)
                .build();

        when(tokenRepository.findTopByEmailOrderByExpiresAtDesc(email)).thenReturn(Optional.of(token));

        OtpLockedException exception = assertThrows(
                OtpLockedException.class,
                () -> passwordResetService.resetPassword(new ResetPasswordRequest(email, "123456", "NewPass123!"))
        );

        assertTrue(exception.getMessage().contains("Mã OTP đã bị khóa do nhập sai quá 5 lần"));
        verify(accountRepository, never()).save(any());
    }

    @Test
    void resetPassword_Success_WhenOtpIsCorrect() {
        String email = "test@example.com";
        OtpToken token = OtpToken.builder()
                .email(email)
                .otp("123456")
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .failedAttempts(1)
                .build();

        Account account = Account.builder()
                .email(email)
                .password("oldPassword")
                .build();

        when(tokenRepository.findTopByEmailOrderByExpiresAtDesc(email)).thenReturn(Optional.of(token));
        when(accountRepository.findByEmail(email)).thenReturn(Optional.of(account));
        when(passwordEncoder.encode("NewPass123!")).thenReturn("encodedPassword");

        assertDoesNotThrow(() -> passwordResetService.resetPassword(new ResetPasswordRequest(email, "123456", "NewPass123!")));

        assertEquals("encodedPassword", account.getPassword());
        verify(accountRepository).save(account);
        verify(tokenRepository).deleteAllByEmail(email);
    }
}
