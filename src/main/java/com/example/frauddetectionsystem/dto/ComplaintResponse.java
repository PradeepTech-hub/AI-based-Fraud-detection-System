package com.example.frauddetectionsystem.dto;

import com.example.frauddetectionsystem.model.ComplaintStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComplaintResponse {
    private Long id;
    private Long userId;
    private Long transactionId;
    private String description;
    private ComplaintStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;
}
