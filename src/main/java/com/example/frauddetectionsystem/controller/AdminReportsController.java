package com.example.frauddetectionsystem.controller;

import com.example.frauddetectionsystem.dto.DashboardStatsDTO;
import com.example.frauddetectionsystem.dto.TransactionResponse;
import com.example.frauddetectionsystem.service.DashboardService;
import com.example.frauddetectionsystem.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/reports")
@RequiredArgsConstructor
public class AdminReportsController {

    private final ReportService reportService;
    private final DashboardService dashboardService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','FRAUD_ANALYST')")
    public ResponseEntity<Map<String, Object>> getMainReport() {
        DashboardStatsDTO stats = dashboardService.getDashboardStats();
        Map<String, Object> report = reportService.getFraudRate();
        report.put("fraudCount", stats.getFraudCount());
        report.put("suspiciousCount", stats.getSuspiciousCount());
        report.put("normalCount", stats.getNormalCount());
        report.put("totalUsers", stats.getTotalUsers());
        report.put("totalBankBalance", stats.getTotalBankBalance());
        report.put("transactionsPerDay", reportService.getTransactionsPerDay());
        report.put("fraudByLocation", reportService.getFraudByLocation());
        report.put("riskDistribution", reportService.getRiskDistribution());
        return ResponseEntity.ok(report);
    }

    @GetMapping("/location")
    @PreAuthorize("hasAnyRole('ADMIN','FRAUD_ANALYST')")
    public ResponseEntity<List<TransactionResponse>> getTransactionsByLocation(
            @RequestParam String location) {
        return ResponseEntity.ok(reportService.getTransactionsByLocation(location));
    }

    @GetMapping("/locations")
    @PreAuthorize("hasAnyRole('ADMIN','FRAUD_ANALYST')")
    public ResponseEntity<List<String>> getAvailableLocations() {
        return ResponseEntity.ok(reportService.getAvailableLocations());
    }

    @GetMapping("/location/download")
    @PreAuthorize("hasAnyRole('ADMIN','FRAUD_ANALYST')")
    public ResponseEntity<InputStreamResource> downloadLocationReport(
            @RequestParam String location) {
        List<TransactionResponse> transactions = reportService.getTransactionsByLocation(location);
        
        StringBuilder csvContent = new StringBuilder();
        csvContent.append("ID,User,User ID,Recipient,Amount,Location,Timestamp,Fraud Status\n");
        
        for (TransactionResponse t : transactions) {
            csvContent.append(String.format("%d,%s,%d,%s,%.2f,%s,%s,%s\n",
                    t.getId(),
                t.getUserName(),
                    t.getUserId(),
                t.getRecipientPhone(),
                    t.getAmount(),
                    t.getLocation(),
                t.getTimestamp(),
                    t.getFraudStatus()
            ));
        }
        
        byte[] csvBytes = csvContent.toString().getBytes(StandardCharsets.UTF_8);
        InputStreamResource resource = new InputStreamResource(new ByteArrayInputStream(csvBytes));
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=report_" + location + ".csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .contentLength(csvBytes.length)
                .body(resource);
    }

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
