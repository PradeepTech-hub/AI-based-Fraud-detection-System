package com.example.frauddetectionsystem.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TopUpRequest {

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be positive")
    private Double amount;

    @NotBlank(message = "Method is required")
    @Size(max = 30, message = "Method must be up to 30 characters")
    private String method; // UPI, CARD, NETBANKING

    @Size(max = 64, message = "Reference must be up to 64 characters")
    private String reference; // optional UTR-like reference
}

