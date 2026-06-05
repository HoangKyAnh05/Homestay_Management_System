package com.homestayManagement.homestayManagement.dto.request;

public record GoogleLoginRequest(
        String credential,
        String accessToken
) {
}
