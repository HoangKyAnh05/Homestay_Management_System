package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.request.LoginRequest;
import com.homestayManagement.homestayManagement.dto.response.AuthResponse;
import com.homestayManagement.homestayManagement.dto.response.UserResponse;
import com.homestayManagement.homestayManagement.entity.User;
import com.homestayManagement.homestayManagement.entity.UserDetail;
import com.homestayManagement.homestayManagement.repository.UserDetailRepository;
import com.homestayManagement.homestayManagement.repository.UserRepository;
import com.homestayManagement.homestayManagement.security.JwtService;
import com.homestayManagement.homestayManagement.service.AuthService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;

@Service
public class AuthServiceImpl implements AuthService {
    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final UserDetailRepository userDetailRepository;
    private final JwtService jwtService;

    public AuthServiceImpl(
            AuthenticationManager authenticationManager,
            UserRepository userRepository,
            UserDetailRepository userDetailRepository,
            JwtService jwtService
    ) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.userDetailRepository = userDetailRepository;
        this.jwtService = jwtService;
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email(), request.password())
            );
        } catch (AuthenticationException exception) {
            throw new IllegalArgumentException("Email hoặc mật khẩu không đúng");
        }

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("Email hoặc mật khẩu không đúng"));

        if (!user.isActive()) {
            throw new IllegalArgumentException("Tài khoản đã bị khóa");
        }

        String token = jwtService.generateToken(user);
        return new AuthResponse("Bearer", token, toUserResponse(user));
    }

    private UserResponse toUserResponse(User user) {
        UserDetail userDetail = userDetailRepository.findById(user.getId()).orElse(null);

        return new UserResponse(
                user.getId(),
                user.getEmail(),
                userDetail != null ? userDetail.getFullName() : user.getEmail(),
                userDetail != null ? userDetail.getPhone() : null,
                userDetail != null ? userDetail.getAvatarUrl() : null,
                user.getRole().getName()
        );
    }
}
