package com.example.frauddetectionsystem.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class PhoneUpdateRequest {

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^[6-9]\\d{9}$", message = "Phone number must be a valid 10-digit Indian mobile number")
    private String phone;
}
