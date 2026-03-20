package com.example.frauddetectionsystem.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiPredictionResponse {
    private double fraudScore;
    private boolean isFraud;
}

