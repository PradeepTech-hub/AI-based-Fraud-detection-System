package com.example.frauddetectionsystem.service;

import com.example.frauddetectionsystem.dto.TransactionResponse;
import com.example.frauddetectionsystem.model.FraudStatus;
import com.example.frauddetectionsystem.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final TransactionRepository transactionRepository;
    private final TransactionService transactionService;

    public Map<String, Object> getFraudRate() {
        long total = transactionRepository.count();
        long fraud = transactionRepository.countByFraudStatus(FraudStatus.FRAUD);
        long suspicious = transactionRepository.countByFraudStatus(FraudStatus.SUSPICIOUS);

        double fraudRate = total == 0 ? 0.0 : (fraud * 100.0) / total;
        double suspiciousRate = total == 0 ? 0.0 : (suspicious * 100.0) / total;

        return Map.of(
                "totalTransactions", total,
                "fraudTransactions", fraud,
                "suspiciousTransactions", suspicious,
                "fraudRate", Math.round(fraudRate * 100.0) / 100.0,
                "suspiciousRate", Math.round(suspiciousRate * 100.0) / 100.0
        );
    }

    public List<Map<String, Object>> getTransactionsPerDay() {
        return transactionRepository.countTransactionsPerDay().stream()
                .map(row -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("date", String.valueOf(row[0]));
                    item.put("count", ((Number) row[1]).longValue());
                    return item;
                })
                .toList();
    }

    public List<Map<String, Object>> getFraudByLocation() {
        return transactionRepository.countFraudByLocation(List.of(FraudStatus.FRAUD, FraudStatus.SUSPICIOUS)).stream()
                .map(row -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("location", String.valueOf(row[0]));
                    item.put("count", ((Number) row[1]).longValue());
                    return item;
                })
                .toList();
    }

    public List<Map<String, Object>> getRiskDistribution() {
        Map<String, Object> low = new LinkedHashMap<>();
        low.put("band", "LOW");
        low.put("count", transactionRepository.countLowRisk());

        Map<String, Object> medium = new LinkedHashMap<>();
        medium.put("band", "MEDIUM");
        medium.put("count", transactionRepository.countMediumRisk());

        Map<String, Object> high = new LinkedHashMap<>();
        high.put("band", "HIGH");
        high.put("count", transactionRepository.countHighRisk());

        return List.of(low, medium, high);
    }

    public List<TransactionResponse> getTransactionsByLocation(String location) {
        String normalized = location == null ? "" : location.trim();
        if (normalized.isEmpty()) {
            return List.of();
        }

        return transactionRepository.findByLocationIgnoreCase(normalized)
                .stream()
                .map(t -> transactionService.mapToResponse(t, null))
                .collect(Collectors.toList());
    }

    public List<String> getAvailableLocations() {
        return transactionRepository.findDistinctLocations().stream()
                .map(loc -> loc == null ? "" : loc.trim())
                .filter(loc -> !loc.isEmpty())
                .distinct()
                .sorted(String::compareToIgnoreCase)
                .collect(Collectors.toList());
    }
}

