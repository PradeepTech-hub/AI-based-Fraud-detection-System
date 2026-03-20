package com.example.frauddetectionsystem.model;

public enum TransactionStatus {
    PENDING,             // Pending verification
    APPROVED,            // Approved
    UNDER_REVIEW,        // Under review
    OTP_PENDING,         // Waiting for OTP verification
    COMPLETED,           // Transaction completed successfully
    BLOCKED              // Transaction blocked
}

