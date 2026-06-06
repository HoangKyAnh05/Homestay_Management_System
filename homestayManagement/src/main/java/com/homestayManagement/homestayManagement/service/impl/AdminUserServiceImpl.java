package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.request.AdminCreateUserRequest;
import com.homestayManagement.homestayManagement.dto.request.AdminUpdateUserRequest;
import com.homestayManagement.homestayManagement.dto.response.AdminUserResponse;
import com.homestayManagement.homestayManagement.entity.Role;
import com.homestayManagement.homestayManagement.entity.User;
import com.homestayManagement.homestayManagement.entity.UserDetail;
import com.homestayManagement.homestayManagement.repository.RoleRepository;
import com.homestayManagement.homestayManagement.repository.UserDetailRepository;
import com.homestayManagement.homestayManagement.repository.UserRepository;
import com.homestayManagement.homestayManagement.service.AdminUserService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AdminUserServiceImpl implements AdminUserService {

    private final UserRepository userRepository;
    private final UserDetailRepository userDetailRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminUserServiceImpl(
            UserRepository userRepository,
            UserDetailRepository userDetailRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.userDetailRepository = userDetailRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminUserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public AdminUserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy user"));
        return toResponse(user);
    }

    @Override
    @Transactional
    public AdminUserResponse createUser(AdminCreateUserRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email đã được sử dụng");
        }

        Role role = roleRepository.findById(request.roleId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy role"));

        User user = User.builder()
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .isVerified(true)
                .isActive(request.isActive())
                .role(role)
                .build();
        userRepository.save(user);

        UserDetail detail = UserDetail.builder()
                .user(user)
                .fullName(request.fullName().trim())
                .phone(blankToNull(request.phone()))
                .build();
        userDetailRepository.save(detail);

        return toResponse(user);
    }

    @Override
    @Transactional
    public AdminUserResponse updateUser(Long id, AdminUpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy user"));

        Role role = roleRepository.findById(request.roleId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy role"));

        user.setRole(role);
        user.setActive(request.isActive());
        userRepository.save(user);

        UserDetail detail = userDetailRepository.findById(id)
                .orElseGet(() -> UserDetail.builder().user(user).build());
        detail.setFullName(request.fullName().trim());
        detail.setPhone(blankToNull(request.phone()));
        userDetailRepository.save(detail);

        return toResponse(user);
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new IllegalArgumentException("Không tìm thấy user");
        }
        userDetailRepository.deleteById(id);
        userRepository.deleteById(id);
    }

    @Override
    @Transactional
    public AdminUserResponse toggleActive(Long id, boolean isActive) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy user"));
        user.setActive(isActive);
        userRepository.save(user);
        return toResponse(user);
    }

    private AdminUserResponse toResponse(User user) {
        UserDetail detail = userDetailRepository.findById(user.getId()).orElse(null);
        return new AdminUserResponse(
                user.getId(),
                user.getEmail(),
                detail != null ? detail.getFullName() : null,
                detail != null ? detail.getPhone() : null,
                detail != null ? detail.getAvatarUrl() : null,
                user.getRole().getName(),
                user.getRole().getId(),
                user.isActive(),
                user.isVerified(),
                user.getCreatedAt()
        );
    }

    private String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }
}
