package com.example.frauddetectionsystem.controller;

import com.example.frauddetectionsystem.dto.TransactionResponse;
import com.example.frauddetectionsystem.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/transactions")
@RequiredArgsConstructor
public class AdminTransactionsController {

    private final TransactionService transactionService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','FRAUD_ANALYST')")
    public ResponseEntity<List<TransactionResponse>> getAllTransactions() {
        return ResponseEntity.ok(transactionService.getAllTransactions());
    }

    @PostMapping("/{transactionId}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> approveTransaction(@PathVariable Long transactionId) {
        transactionService.approveTransaction(transactionId);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Transaction approved successfully.");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{transactionId}/block")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> blockTransaction(@PathVariable Long transactionId) {
        transactionService.blockTransaction(transactionId);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Transaction blocked successfully.");
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{transactionId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> deleteTransaction(@PathVariable Long transactionId) {
        transactionService.deleteTransaction(transactionId);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Transaction deleted successfully.");
        return ResponseEntity.ok(response);
    }

    @DeleteMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> deleteAllTransactions() {
        transactionService.deleteAllTransactions();
        Map<String, Object> response = new HashMap<>();
        response.put("message", "All transactions deleted successfully.");
        return ResponseEntity.ok(response);
    }
}
