package com.example.frauddetectionsystem.service;

import com.example.frauddetectionsystem.dto.DashboardStatsDTO;
import com.example.frauddetectionsystem.dto.TransactionResponse;
import com.example.frauddetectionsystem.model.FraudStatus;
import com.example.frauddetectionsystem.repository.TransactionRepository;
import com.example.frauddetectionsystem.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final TransactionService transactionService;

    public DashboardStatsDTO getDashboardStats() {
        long total = transactionRepository.count();
        long fraudCount = transactionRepository.countByFraudStatus(FraudStatus.FRAUD);
        long suspiciousCount = transactionRepository.countByFraudStatus(FraudStatus.SUSPICIOUS);
        long normalCount = transactionRepository.countByFraudStatus(FraudStatus.NORMAL);
        long totalUsers = userRepository.count();
        double totalBankBalance = userRepository.getTotalBalance() != null ? userRepository.getTotalBalance() : 0.0;
        double fraudRate = total > 0 ? (double) fraudCount / total * 100 : 0;

        List<TransactionResponse> recent = transactionRepository.findTop10ByOrderByTimestampDesc()
                .stream().map(t -> transactionService.mapToResponse(t, null))
                .collect(Collectors.toList());

        return DashboardStatsDTO.builder()
                .totalTransactions(total)
                .fraudCount(fraudCount)
                .suspiciousCount(suspiciousCount)
                .normalCount(normalCount)
                .fraudRate(Math.round(fraudRate * 100.0) / 100.0)
                .totalUsers(totalUsers)
                .totalBankBalance(Math.round(totalBankBalance * 100.0) / 100.0)
                .recentTransactions(recent)
                .build();
    }
}

