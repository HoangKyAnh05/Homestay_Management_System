package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.request.AdminCreateUserRequest;
import com.homestayManagement.homestayManagement.dto.request.AdminUpdateUserRequest;
import com.homestayManagement.homestayManagement.dto.response.AdminUserResponse;

import java.util.List;

public interface AdminUserService {
    List<AdminUserResponse> getAllUsers();
    AdminUserResponse getUserById(Long id);
    AdminUserResponse createUser(AdminCreateUserRequest request);
    AdminUserResponse updateUser(Long id, AdminUpdateUserRequest request);
    void deleteUser(Long id);
}
