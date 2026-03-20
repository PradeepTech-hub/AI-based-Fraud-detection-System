package com.example.frauddetectionsystem.controller;

import com.example.frauddetectionsystem.dto.FraudCaseResponse;
import com.example.frauddetectionsystem.dto.TransactionResponse;
import com.example.frauddetectionsystem.service.FraudCaseService;
import com.example.frauddetectionsystem.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/fraud-alerts")
@RequiredArgsConstructor
public class AdminFraudAlertsController {

    private final TransactionService transactionService;
    private final FraudCaseService fraudCaseService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','FRAUD_ANALYST')")
    public ResponseEntity<List<TransactionResponse>> getFraudAlerts() {
        // Get all transactions that are fraud or suspicious
        List<TransactionResponse> allTransactions = transactionService.getAllTransactions();
        List<TransactionResponse> fraudAlerts = allTransactions.stream()
                .filter(t -> "FRAUD".equalsIgnoreCase(String.valueOf(t.getFraudStatus())) ||
                             "SUSPICIOUS".equalsIgnoreCase(String.valueOf(t.getFraudStatus())))
                .toList();
        return ResponseEntity.ok(fraudAlerts);
    }

    @GetMapping("/cases")
    @PreAuthorize("hasAnyRole('ADMIN','FRAUD_ANALYST')")
    public ResponseEntity<List<FraudCaseResponse>> getFraudCases() {
        return ResponseEntity.ok(fraudCaseService.getAllCases());
    }
}
