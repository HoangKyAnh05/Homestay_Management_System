package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PublicBookingFeedbackRequest(
        @NotBlank(message = "Vui lòng nhập nội dung phản hồi")
        @Size(max = 1000, message = "Phản hồi không được vượt quá 1000 ký tự")
        String feedback
) {
}
