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

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateReviewRequestDto {

    @NotNull(message = "Ma don dat phong khong duoc de trong")
    private Long bookingId;

    @NotNull(message = "So sao danh gia khong duoc de trong")
    @Min(value = 1, message = "Danh gia toi thieu la 1 sao")
    @Max(value = 5, message = "Danh gia toi da la 5 sao")
    private Integer ratingStars;

    @NotBlank(message = "Noi dung nhan xet khong duoc de trong")
    @Size(max = 1000, message = "Noi dung nhan xet khong vuot qua 1000 ky tu")
    private String comment;

    private java.util.List<String> imageUrls;
}

