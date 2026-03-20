package com.example.frauddetectionsystem.controller;

import com.example.frauddetectionsystem.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportsController {

    private final ReportService reportService;

    @GetMapping("/fraud-rate")
    @PreAuthorize("hasAnyRole('ADMIN','FRAUD_ANALYST')")
    public ResponseEntity<Map<String, Object>> getFraudRate() {
        return ResponseEntity.ok(reportService.getFraudRate());
    }

    @GetMapping("/transactions-per-day")
    @PreAuthorize("hasAnyRole('ADMIN','FRAUD_ANALYST')")
    public ResponseEntity<List<Map<String, Object>>> getTransactionsPerDay() {
        return ResponseEntity.ok(reportService.getTransactionsPerDay());
    }

    @GetMapping("/fraud-by-location")
    @PreAuthorize("hasAnyRole('ADMIN','FRAUD_ANALYST')")
    public ResponseEntity<List<Map<String, Object>>> getFraudByLocation() {
        return ResponseEntity.ok(reportService.getFraudByLocation());
    }

    @GetMapping("/risk-distribution")
    @PreAuthorize("hasAnyRole('ADMIN','FRAUD_ANALYST')")
    public ResponseEntity<List<Map<String, Object>>> getRiskDistribution() {
        return ResponseEntity.ok(reportService.getRiskDistribution());
    }
}

