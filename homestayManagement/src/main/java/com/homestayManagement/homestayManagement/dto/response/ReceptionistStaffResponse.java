package com.homestayManagement.homestayManagement.dto.response;

public record ReceptionistStaffResponse(
        Long employeeId,
        Long accountId,
        String fullName,
        String email,
        String phone,
        String avatarUrl
) {
}
