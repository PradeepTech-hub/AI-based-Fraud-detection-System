package com.example.frauddetectionsystem.controller;

import com.example.frauddetectionsystem.dto.CaseResolutionRequest;
import com.example.frauddetectionsystem.dto.FraudCaseResponse;
import com.example.frauddetectionsystem.service.FraudCaseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/fraud-cases")
@RequiredArgsConstructor
public class FraudCaseController {

    private final FraudCaseService fraudCaseService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','FRAUD_ANALYST')")
    public ResponseEntity<List<FraudCaseResponse>> getFraudCases() {
        return ResponseEntity.ok(fraudCaseService.getAllCases());
    }

    @PostMapping("/{id}/resolve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FraudCaseResponse> resolveCase(@PathVariable Long id,
                                                         @Valid @RequestBody(required = false) CaseResolutionRequest request) {
        String notes = request == null ? null : request.getAnalystNotes();
        return ResponseEntity.ok(fraudCaseService.resolveCase(id, notes));
    }

    @PostMapping("/{id}/investigate")
    @PreAuthorize("hasAnyRole('ADMIN','FRAUD_ANALYST')")
    public ResponseEntity<FraudCaseResponse> investigateCase(@PathVariable Long id,
                                                             @Valid @RequestBody(required = false) CaseResolutionRequest request) {
        String notes = request == null ? null : request.getAnalystNotes();
        return ResponseEntity.ok(fraudCaseService.investigateCase(id, notes));
    }

    @PostMapping("/{id}/false-positive")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FraudCaseResponse> markFalsePositive(@PathVariable Long id,
                                                                @Valid @RequestBody(required = false) CaseResolutionRequest request) {
        String notes = request == null ? null : request.getAnalystNotes();
        return ResponseEntity.ok(fraudCaseService.markFalsePositive(id, notes));
    }
}

