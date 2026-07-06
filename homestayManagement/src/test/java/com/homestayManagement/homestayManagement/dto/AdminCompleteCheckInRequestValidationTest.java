package com.homestayManagement.homestayManagement.dto;

import com.homestayManagement.homestayManagement.dto.request.AdminCheckInGuestRequest;
import com.homestayManagement.homestayManagement.dto.request.AdminCompleteCheckInRequest;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AdminCompleteCheckInRequestValidationTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void acceptsRepresentativeEmailForRoomAccess() {
        var request = new AdminCompleteCheckInRequest(
                101L,
                "guest@example.com",
                List.of(validGuest())
        );

        assertTrue(validator.validate(request).isEmpty());
    }

    @Test
    void rejectsMissingRepresentativeEmail() {
        var request = new AdminCompleteCheckInRequest(
                101L,
                "",
                List.of(validGuest())
        );

        var violations = validator.validate(request);

        assertEquals(1, violations.size());
        assertEquals("representativeEmail", violations.iterator().next().getPropertyPath().toString());
    }

    private AdminCheckInGuestRequest validGuest() {
        return new AdminCheckInGuestRequest(
                "Nguyễn Văn A",
                "012345678901",
                null,
                "guest@example.com",
                "0912345678",
                null,
                null,
                "VIETNAM"
        );
    }
}
