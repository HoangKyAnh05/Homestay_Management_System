package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.entity.Customer;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class AuthServiceImplAvatarTest {

    @Test
    void googleAvatarIsUsedWhenCustomerHasNoCustomAvatar() {
        Customer customer = Customer.builder().build();

        AuthServiceImpl.syncGoogleAvatar(customer, "https://google.example/avatar.jpg");

        assertEquals("https://google.example/avatar.jpg", customer.getAvatarUrl());
        assertEquals("https://google.example/avatar.jpg", customer.getGoogleAvatarUrl());
        assertEquals("GOOGLE", customer.getAvatarSource());
    }

    @Test
    void googleLoginDoesNotOverwriteUserUploadedAvatar() {
        Customer customer = Customer.builder()
                .avatarUrl("/uploads/avatar-custom.jpg")
                .avatarSource("USER_UPLOAD")
                .build();

        AuthServiceImpl.syncGoogleAvatar(customer, "https://google.example/new-avatar.jpg");

        assertEquals("/uploads/avatar-custom.jpg", customer.getAvatarUrl());
        assertEquals("https://google.example/new-avatar.jpg", customer.getGoogleAvatarUrl());
        assertEquals("USER_UPLOAD", customer.getAvatarSource());
    }

    @Test
    void existingLocalAvatarIsMigratedToUserUploadPriority() {
        Customer customer = Customer.builder()
                .avatarUrl("/uploads/avatar-legacy.jpg")
                .build();

        AuthServiceImpl.syncGoogleAvatar(customer, "https://google.example/avatar.jpg");

        assertEquals("/uploads/avatar-legacy.jpg", customer.getAvatarUrl());
        assertEquals("USER_UPLOAD", customer.getAvatarSource());
    }
}
