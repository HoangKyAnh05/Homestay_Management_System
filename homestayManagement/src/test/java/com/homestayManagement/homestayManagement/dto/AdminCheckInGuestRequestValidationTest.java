package com.homestayManagement.homestayManagement.dto;

import com.homestayManagement.homestayManagement.dto.request.AdminCheckInGuestRequest;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AdminCheckInGuestRequestValidationTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void acceptsValidVietnameseIdentityPhoneAndEmail() {
        var request = guest("012345678901", "0912345678", "guest@example.com");

        assertTrue(validator.validate(request).isEmpty());
    }

    @Test
    void rejectsIdentityThatDoesNotContainExactlyTwelveDigits() {
        var violations = validator.validate(guest("12345678901", "0912345678", "guest@example.com"));

        assertEquals(1, violations.size());
        assertEquals("identityDocumentNumber", violations.iterator().next().getPropertyPath().toString());
    }

    @Test
    void rejectsPhoneThatDoesNotContainExactlyTenDigits() {
        var violations = validator.validate(guest("012345678901", "091234567", "guest@example.com"));

        assertEquals(1, violations.size());
        assertEquals("phone", violations.iterator().next().getPropertyPath().toString());
    }

    @Test
    void rejectsInvalidEmailFormat() {
        var violations = validator.validate(guest("012345678901", "0912345678", "invalid-email"));

        assertEquals(1, violations.size());
        assertEquals("email", violations.iterator().next().getPropertyPath().toString());
    }

    private AdminCheckInGuestRequest guest(String identity, String phone, String email) {
        return new AdminCheckInGuestRequest(
                "Nguyễn Văn A",
                identity,
                null,
                email,
                phone,
                null,
                null,
                "VIETNAM"
        );
    }
}
