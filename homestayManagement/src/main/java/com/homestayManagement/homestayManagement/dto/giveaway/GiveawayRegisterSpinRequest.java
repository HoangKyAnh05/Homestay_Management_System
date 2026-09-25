package com.homestayManagement.homestayManagement.dto.giveaway;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GiveawayRegisterSpinRequest {

    @NotBlank(message = "Họ và tên không được để trống")
    @Size(min = 2, max = 120, message = "Họ và tên phải từ 2 đến 120 ký tự")
    private String fullName;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^(0|\\+84)(\\d{9})$", message = "Số điện thoại không đúng định dạng Việt Nam (10 chữ số)")
    private String phone;

    @NotBlank(message = "Địa chỉ Gmail/Email không được để trống")
    @Pattern(regexp = "^[\\w._%+-]+@[\\w.-]+\\.[A-Za-z]{2,64}$", message = "Địa chỉ Gmail/Email không đúng định dạng (VD: example@gmail.com)")
    private String email;

    private String travelPlan;

    private String notes;
}
