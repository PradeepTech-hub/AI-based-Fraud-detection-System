package com.example.frauddetectionsystem.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequest {

    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name must be up to 100 characters")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @Size(max = 120, message = "Bank name must be up to 120 characters")
    private String bankName;

    @Size(max = 30, message = "Bank account number must be up to 30 characters")
    private String bankAccountNumber;

    @Size(max = 20, message = "IFSC must be up to 20 characters")
    private String bankIfsc;
}

