package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.request.UpdateProfileRequest;
import com.homestayManagement.homestayManagement.dto.response.UserResponse;
import org.springframework.web.multipart.MultipartFile;

public interface UserService {
    UserResponse getCurrentUserProfile(String email);

    UserResponse updateCurrentUserProfile(String email, UpdateProfileRequest request);

    UserResponse updateCurrentUserAvatar(String email, MultipartFile avatar);
}
