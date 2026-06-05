package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.request.ForgotPasswordRequest;
import com.homestayManagement.homestayManagement.dto.request.ResetPasswordRequest;
import com.homestayManagement.homestayManagement.dto.request.VerifyOtpRequest;

public interface PasswordResetService {

    void sendOtp(ForgotPasswordRequest request);

    void verifyOtp(VerifyOtpRequest request);

    void resetPassword(ResetPasswordRequest request);
}
