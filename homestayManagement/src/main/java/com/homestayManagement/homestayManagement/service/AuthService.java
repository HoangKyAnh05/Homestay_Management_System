package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.request.GoogleLoginRequest;
import com.homestayManagement.homestayManagement.dto.request.LoginRequest;
import com.homestayManagement.homestayManagement.dto.response.AuthResponse;

public interface AuthService {
    AuthResponse login(LoginRequest request);

    AuthResponse loginWithGoogle(GoogleLoginRequest request);
}
