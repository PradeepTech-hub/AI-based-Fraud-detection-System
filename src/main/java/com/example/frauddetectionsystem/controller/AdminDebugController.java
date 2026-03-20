package com.example.frauddetectionsystem.controller;

import com.example.frauddetectionsystem.service.TransactionDebugService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/debug")
@RequiredArgsConstructor
public class AdminDebugController {

    private final TransactionDebugService transactionDebugService;

    @GetMapping("/last-transaction-error")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TransactionDebugService.LastError> lastTransactionError() {
        return ResponseEntity.ok(transactionDebugService.getLastError());
    }
}

