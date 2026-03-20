package com.example.frauddetectionsystem.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RiskAssessmentResult {
    // Normalized score in the range [0.0, 1.0].
    private double riskScore;
    private String fraudReason;
}

