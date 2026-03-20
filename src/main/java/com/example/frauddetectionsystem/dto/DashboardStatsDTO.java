package com.example.frauddetectionsystem.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDTO {
    private long totalTransactions;
    private long fraudCount;
    private long suspiciousCount;
    private long normalCount;
    private double fraudRate;
    private long totalUsers;
    private double totalBankBalance;
    private List<TransactionResponse> recentTransactions;
}

