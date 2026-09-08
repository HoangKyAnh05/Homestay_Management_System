package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.constraints.NotBlank;

public record RedeemVoucherRequest(
        @NotBlank(message = "Vui lòng chọn gói đổi voucher")
        String packageId
) {
}
