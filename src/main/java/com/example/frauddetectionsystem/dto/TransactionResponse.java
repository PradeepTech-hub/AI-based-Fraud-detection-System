package com.example.frauddetectionsystem.dto;

import com.example.frauddetectionsystem.model.FraudStatus;
import com.example.frauddetectionsystem.model.RiskLevel;
import com.example.frauddetectionsystem.model.TransactionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionResponse {
    private Long id;
    private Long userId;
    private String userName;
    private Double amount;
    private String location;
    private LocalDateTime timestamp;
    private FraudStatus fraudStatus;
    private TransactionStatus transactionStatus;
    private Double riskScore;
    private RiskLevel riskLevel;
    private String fraudReason;
    private String ipAddress;
    private String deviceType;
    private String deviceId;
    private String recipientPhone;
    private String paymentMethod;
    private String upiVpa;
    private String merchantName;
    private String paymentReference;
    private String paymentStatus;
    private Boolean otpRequired;
    private String demoOtp;
    private Boolean debited;
    private Double remainingBalance;
    private String message;
}

