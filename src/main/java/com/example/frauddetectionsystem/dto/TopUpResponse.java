package com.example.frauddetectionsystem.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopUpResponse {
    private Long id;
    private Long userId;
    private Double amount;
    private String method;
    private String reference;
    private String status;
    private LocalDateTime createdAt;
    private Double newBalance;
    private String message;
}

