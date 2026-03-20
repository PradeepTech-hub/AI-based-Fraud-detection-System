package com.example.frauddetectionsystem.dto;

import com.example.frauddetectionsystem.model.FraudCaseStatus;
import com.example.frauddetectionsystem.model.RiskLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FraudCaseResponse {
    private Long id;
    private Long transactionId;
    private Long userId;
    private Double riskScore;
    private RiskLevel riskLevel;
    private String reason;
    private FraudCaseStatus status;
    private String analystNotes;
    private LocalDateTime escalationDeadline;
    private Boolean escalated;
    private LocalDateTime escalatedAt;
    private LocalDateTime createdAt;
}

