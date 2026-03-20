package com.example.frauddetectionsystem.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class OtpVerificationRequest {
    @NotBlank(message = "OTP is required")
    @Pattern(regexp = "^\\d{6}$", message = "OTP must be a 6-digit code")
    private String otp;
}
