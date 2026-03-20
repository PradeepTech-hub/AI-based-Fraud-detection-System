package com.example.frauddetectionsystem.service;

import com.example.frauddetectionsystem.dto.FraudCaseResponse;
import com.example.frauddetectionsystem.model.FraudCase;
import com.example.frauddetectionsystem.model.FraudCaseStatus;
import com.example.frauddetectionsystem.model.FraudStatus;
import com.example.frauddetectionsystem.model.RiskLevel;
import com.example.frauddetectionsystem.model.Transaction;
import com.example.frauddetectionsystem.realtime.AlertPublisher;
import com.example.frauddetectionsystem.repository.FraudCaseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FraudCaseService {

    private final FraudCaseRepository fraudCaseRepository;
    private final NotificationService notificationService;
    private final AlertPublisher alertPublisher;

    @Value("${fraud.sla.high.minutes:5}")
    private int highRiskSlaMinutes;

    @Value("${fraud.sla.medium.minutes:15}")
    private int mediumRiskSlaMinutes;

    @Value("${fraud.sla.low.minutes:30}")
    private int lowRiskSlaMinutes;

    public void openOrUpdateCaseForTransaction(Transaction transaction) {
        if (transaction.getFraudStatus() == FraudStatus.NORMAL) {
            return;
        }

        FraudCase fraudCase = fraudCaseRepository.findByTransactionId(transaction.getId())
                .orElse(FraudCase.builder()
                        .transactionId(transaction.getId())
                        .userId(transaction.getUserId())
                        .build());

        RiskLevel riskLevel = determineRiskLevel(transaction.getRiskScore());
        fraudCase.setRiskScore(transaction.getRiskScore());
        fraudCase.setRiskLevel(riskLevel);
        fraudCase.setReason(transaction.getFraudReason() == null || transaction.getFraudReason().isBlank()
                ? "Flagged by risk engine"
                : transaction.getFraudReason());

        if (fraudCase.getStatus() == null || fraudCase.getStatus() == FraudCaseStatus.RESOLVED || fraudCase.getStatus() == FraudCaseStatus.FALSE_POSITIVE) {
            fraudCase.setStatus(FraudCaseStatus.OPEN);
            fraudCase.setEscalated(false);
            fraudCase.setEscalatedAt(null);
            fraudCase.setEscalationDeadline(LocalDateTime.now().plusMinutes(getSlaMinutes(riskLevel)));
        }

        FraudCase saved = fraudCaseRepository.save(fraudCase);
        alertPublisher.publish("FRAUD_CASE_OPENED", mapToResponse(saved));
    }

    public List<FraudCaseResponse> getAllCases() {
        return fraudCaseRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToResponse)
                .toList();
    }

    public FraudCaseResponse resolveCase(Long caseId, String analystNotes) {
        FraudCase fraudCase = getCaseOrThrow(caseId);
        fraudCase.setStatus(FraudCaseStatus.RESOLVED);
        fraudCase.setAnalystNotes(analystNotes);
        FraudCase saved = fraudCaseRepository.save(fraudCase);
        alertPublisher.publish("FRAUD_CASE_RESOLVED", mapToResponse(saved));
        return mapToResponse(saved);
    }

    public FraudCaseResponse markFalsePositive(Long caseId, String analystNotes) {
        FraudCase fraudCase = getCaseOrThrow(caseId);
        fraudCase.setStatus(FraudCaseStatus.FALSE_POSITIVE);
        fraudCase.setAnalystNotes(analystNotes);
        FraudCase saved = fraudCaseRepository.save(fraudCase);
        alertPublisher.publish("FRAUD_CASE_FALSE_POSITIVE", mapToResponse(saved));
        return mapToResponse(saved);
    }

    public FraudCaseResponse investigateCase(Long caseId, String analystNotes) {
        FraudCase fraudCase = getCaseOrThrow(caseId);
        fraudCase.setStatus(FraudCaseStatus.INVESTIGATING);
        fraudCase.setAnalystNotes(analystNotes);
        FraudCase saved = fraudCaseRepository.save(fraudCase);
        alertPublisher.publish("FRAUD_CASE_INVESTIGATING", mapToResponse(saved));
        return mapToResponse(saved);
    }

    public int escalateDueCases() {
        List<FraudCase> dueCases = fraudCaseRepository.findByStatusInAndEscalatedFalseAndEscalationDeadlineBefore(
                List.of(FraudCaseStatus.OPEN, FraudCaseStatus.INVESTIGATING),
                LocalDateTime.now()
        );

        for (FraudCase fraudCase : dueCases) {
            fraudCase.setEscalated(true);
            fraudCase.setEscalatedAt(LocalDateTime.now());
            fraudCase.setStatus(FraudCaseStatus.INVESTIGATING);

            String existingNotes = fraudCase.getAnalystNotes() == null ? "" : fraudCase.getAnalystNotes().trim();
            String slaNote = "SLA escalation triggered for " + fraudCase.getRiskLevel() + " risk case.";
            fraudCase.setAnalystNotes(existingNotes.isEmpty() ? slaNote : existingNotes + " | " + slaNote);

            FraudCase saved = fraudCaseRepository.save(fraudCase);
            alertPublisher.publish("FRAUD_CASE_ESCALATED", mapToResponse(saved));
            notificationService.sendCaseEscalationAlert(saved);
        }

        return dueCases.size();
    }

    private FraudCase getCaseOrThrow(Long caseId) {
        return fraudCaseRepository.findById(caseId)
                .orElseThrow(() -> new IllegalArgumentException("Fraud case not found: " + caseId));
    }

    private FraudCaseResponse mapToResponse(FraudCase fraudCase) {
        return FraudCaseResponse.builder()
                .id(fraudCase.getId())
                .transactionId(fraudCase.getTransactionId())
                .userId(fraudCase.getUserId())
                .riskScore(fraudCase.getRiskScore())
                .riskLevel(fraudCase.getRiskLevel())
                .reason(fraudCase.getReason())
                .status(fraudCase.getStatus())
                .analystNotes(fraudCase.getAnalystNotes())
                .escalationDeadline(fraudCase.getEscalationDeadline())
                .escalated(fraudCase.getEscalated())
                .escalatedAt(fraudCase.getEscalatedAt())
                .createdAt(fraudCase.getCreatedAt())
                .build();
    }

    private RiskLevel determineRiskLevel(Double riskScore) {
        if (riskScore == null) {
            return RiskLevel.LOW;
        }
        if (riskScore >= 0.8) {
            return RiskLevel.HIGH;
        }
        if (riskScore >= 0.4) {
            return RiskLevel.MEDIUM;
        }
        return RiskLevel.LOW;
    }

    private int getSlaMinutes(RiskLevel riskLevel) {
        return switch (riskLevel) {
            case HIGH -> highRiskSlaMinutes;
            case MEDIUM -> mediumRiskSlaMinutes;
            case LOW -> lowRiskSlaMinutes;
        };
    }
}

