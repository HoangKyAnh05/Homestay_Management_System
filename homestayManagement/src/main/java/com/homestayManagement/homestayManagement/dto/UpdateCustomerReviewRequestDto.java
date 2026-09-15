package com.homestayManagement.homestayManagement.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateCustomerReviewRequestDto {

    @NotNull(message = "Số sao đánh giá không được để trống")
    @Min(value = 1, message = "Đánh giá tối thiểu là 1 sao")
    @Max(value = 5, message = "Đánh giá tối đa là 5 sao")
    private Integer ratingStars;

    @NotBlank(message = "Nội dung nhận xét không được để trống")
    @Size(max = 1000, message = "Nội dung nhận xét không vượt quá 1000 ký tự")
    private String comment;

    private List<String> imageUrls;
}
