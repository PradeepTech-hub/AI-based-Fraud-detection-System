package com.example.frauddetectionsystem.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TransactionRequest {
    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be positive")
    private Double amount;

    @NotBlank(message = "Location is required")
    private String location;

    @Size(max = 64, message = "IP address must be up to 64 characters")
    private String ipAddress;

    @Size(max = 100, message = "Device type must be up to 100 characters")
    private String deviceType;

    @Size(max = 120, message = "Device ID must be up to 120 characters")
    private String deviceId;

    // Realistic payment details (demo)
    @Size(max = 120, message = "Merchant name must be up to 120 characters")
    private String merchantName;

    @NotBlank(message = "Recipient phone is required")
    @Pattern(regexp = "^[6-9]\\d{9}$", message = "Recipient phone must be a valid 10-digit Indian mobile number")
    private String recipientPhone;

    @NotBlank(message = "Payment method is required")
    @Size(max = 30, message = "Payment method must be up to 30 characters")
    private String paymentMethod; // UPI, WALLET, CARD, NETBANKING

    @Size(max = 100, message = "UPI VPA must be up to 100 characters")
    private String upiVpa; // required on UI when paymentMethod == UPI

    // Optional: user may be set from JWT context in the service
    private Long userId;
}

