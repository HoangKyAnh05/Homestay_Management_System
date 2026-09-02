package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ShiftHandoverRequest(
        @NotBlank(message = "Vui lòng chọn nhân viên giao ca (ca trước)")
        String outgoingEmail,

        @NotBlank(message = "Vui lòng nhập mật khẩu xác nhận của nhân viên giao ca")
        String outgoingPassword,

        @NotNull(message = "Vui lòng nhập số tiền mặt thực tế bàn giao")
        BigDecimal actualCash,

        @NotNull(message = "Vui lòng chọn trạng thái đối soát đủ tiền hay thiếu tiền")
        Boolean isSufficient,

        BigDecimal shortageAmount,

        String shortageReason,

        LocalDateTime compensationDeadline,

        String notes
) {
}
