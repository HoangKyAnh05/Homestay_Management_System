package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.request.UpdateProfileRequest;
import com.homestayManagement.homestayManagement.dto.response.UserResponse;
import com.homestayManagement.homestayManagement.entity.User;
import com.homestayManagement.homestayManagement.entity.UserDetail;
import com.homestayManagement.homestayManagement.repository.UserDetailRepository;
import com.homestayManagement.homestayManagement.repository.UserRepository;
import com.homestayManagement.homestayManagement.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Set;
import java.util.UUID;

@Service
public class UserServiceImpl implements UserService {
    private static final Path UPLOAD_DIR = Paths.get("uploads");
    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of("image/jpeg", "image/png", "image/webp");

    private final UserRepository userRepository;
    private final UserDetailRepository userDetailRepository;

    public UserServiceImpl(UserRepository userRepository, UserDetailRepository userDetailRepository) {
        this.userRepository = userRepository;
        this.userDetailRepository = userDetailRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUserProfile(String email) {
        User user = getUserByEmail(email);
        return toUserResponse(user);
    }

    @Override
    @Transactional
    public UserResponse updateCurrentUserProfile(String email, UpdateProfileRequest request) {
        User user = getUserByEmail(email);
        UserDetail userDetail = userDetailRepository.findById(user.getId())
                .orElseGet(() -> UserDetail.builder().user(user).build());

        userDetail.setFullName(request.fullName().trim());
        userDetail.setPhone(blankToNull(request.phone()));
        userDetail.setDateOfBirth(request.dateOfBirth());
        userDetail.setAddress(blankToNull(request.address()));

        userDetailRepository.save(userDetail);
        return toUserResponse(user);
    }

    @Override
    @Transactional
    public UserResponse updateCurrentUserAvatar(String email, MultipartFile avatar) {
        if (avatar == null || avatar.isEmpty()) {
            throw new IllegalArgumentException("Vui long chon anh dai dien");
        }

        if (!ALLOWED_IMAGE_TYPES.contains(avatar.getContentType())) {
            throw new IllegalArgumentException("Anh dai dien chi ho tro JPG, PNG hoac WEBP");
        }

        User user = getUserByEmail(email);
        UserDetail userDetail = userDetailRepository.findById(user.getId())
                .orElseGet(() -> UserDetail.builder().user(user).fullName(user.getEmail()).build());

        try {
            Files.createDirectories(UPLOAD_DIR);
            String filename = "avatar-" + user.getId() + "-" + UUID.randomUUID() + getExtension(avatar.getOriginalFilename());
            Path targetPath = UPLOAD_DIR.resolve(filename).normalize();
            avatar.transferTo(targetPath);
            userDetail.setAvatarUrl("/uploads/" + filename);
            userDetailRepository.save(userDetail);
        } catch (IOException exception) {
            throw new IllegalArgumentException("Khong the luu anh dai dien");
        }

        return toUserResponse(user);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay nguoi dung"));
    }

    private UserResponse toUserResponse(User user) {
        UserDetail userDetail = userDetailRepository.findById(user.getId()).orElse(null);

        return new UserResponse(
                user.getId(),
                user.getEmail(),
                userDetail != null ? userDetail.getFullName() : user.getEmail(),
                userDetail != null ? userDetail.getPhone() : null,
                userDetail != null ? userDetail.getDateOfBirth() : null,
                userDetail != null ? userDetail.getAddress() : null,
                userDetail != null ? userDetail.getAvatarUrl() : null,
                user.getRole().getName()
        );
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return ".jpg";
        }

        String extension = filename.substring(filename.lastIndexOf(".")).toLowerCase();
        if (!Set.of(".jpg", ".jpeg", ".png", ".webp").contains(extension)) {
            return ".jpg";
        }

        return extension;
    }
}
