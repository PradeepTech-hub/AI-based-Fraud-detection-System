package com.example.frauddetectionsystem.service;

import com.example.frauddetectionsystem.model.*;
import com.example.frauddetectionsystem.repository.FraudCaseRepository;
import com.example.frauddetectionsystem.repository.SLAConfigurationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class SLAService {

    private final SLAConfigurationRepository slaRepository;
    private final FraudCaseRepository fraudCaseRepository;
    private final NotificationService notificationService;

    /**
     * Initialize default SLA configurations on first run
     */
    public void initializeDefaultSLAs() {
        for (RiskLevel riskLevel : RiskLevel.values()) {
            if (slaRepository.findByRiskLevel(riskLevel).isEmpty()) {
                SLAConfiguration config = SLAConfiguration.getDefault(riskLevel);
                slaRepository.save(config);
                log.info("Initialized SLA for {}: {} minutes", riskLevel, config.getEscalationMinutes());
            }
        }
    }

    /**
     * Calculate escalation deadline based on risk level
     */
    public LocalDateTime calculateEscalationDeadline(RiskLevel riskLevel) {
        Optional<SLAConfiguration> slaOpt = slaRepository.findByRiskLevelAndEnabledTrue(riskLevel);
        if (slaOpt.isEmpty()) {
            log.warn("No SLA configuration found for {}", riskLevel);
            return LocalDateTime.now().plusHours(1); // Default 1 hour
        }

        Integer escalationMinutes = slaOpt.get().getEscalationMinutes();
        LocalDateTime deadline = LocalDateTime.now().plusMinutes(escalationMinutes);
        log.info("Escalation deadline for {} risk: {} minutes from now", riskLevel, escalationMinutes);
        return deadline;
    }

    /**
     * Get SLA details for a risk level
     */
    public SLAConfiguration getSLAConfiguration(RiskLevel riskLevel) {
        return slaRepository.findByRiskLevel(riskLevel)
                .orElseGet(() -> SLAConfiguration.getDefault(riskLevel));
    }

    /**
     * Update SLA configuration for a risk level
     */
    public SLAConfiguration updateSLA(RiskLevel riskLevel, Integer escalationMinutes, Boolean enabled) {
        Optional<SLAConfiguration> existingOpt = slaRepository.findByRiskLevel(riskLevel);
        SLAConfiguration config;

        if (existingOpt.isPresent()) {
            config = existingOpt.get();
            config.setEscalationMinutes(escalationMinutes);
            config.setEnabled(enabled);
        } else {
            config = SLAConfiguration.builder()
                    .riskLevel(riskLevel)
                    .escalationMinutes(escalationMinutes)
                    .enabled(enabled)
                    .description("Updated SLA for " + riskLevel)
                    .build();
        }

        SLAConfiguration saved = slaRepository.save(config);
        log.info("Updated SLA for {}: {} minutes", riskLevel, escalationMinutes);
        return saved;
    }

    /**
     * Scheduled task to check and escalate due cases (runs every minute)
     */
    @Scheduled(fixedRate = 60000) // Every 60 seconds
    public void checkAndEscalateDueCases() {
        LocalDateTime now = LocalDateTime.now();

        // Find all non-escalated cases that have passed their escalation deadline
        List<FraudCase> dueCases = fraudCaseRepository.findByStatus(FraudCaseStatus.PENDING);
        dueCases.stream()
                .filter(fc -> !Boolean.TRUE.equals(fc.getEscalated()))
                .filter(fc -> fc.getEscalationDeadline() != null && fc.getEscalationDeadline().isBefore(now))
                .forEach(this::escalateCase);
    }

    /**
     * Escalate a fraud case
     */
    public void escalateCase(FraudCase fraudCase) {
        try {
            if (Boolean.TRUE.equals(fraudCase.getEscalated())) {
                log.warn("Case {} already escalated", fraudCase.getId());
                return;
            }

            fraudCase.setEscalated(true);
            fraudCase.setEscalatedAt(LocalDateTime.now());
            fraudCaseRepository.save(fraudCase);

            log.info("Escalated fraud case {} (Risk Level: {})", fraudCase.getId(), fraudCase.getRiskLevel());

            // Send escalation notification
            notificationService.sendCaseEscalationAlert(fraudCase);

        } catch (Exception e) {
            log.error("Error escalating case {}", fraudCase.getId(), e);
        }
    }

    /**
     * Get SLA status for a fraud case
     */
    public String getSLAStatus(FraudCase fraudCase) {
        if (fraudCase.getEscalationDeadline() == null) {
            return "NO_SLA";
        }

        LocalDateTime now = LocalDateTime.now();
        if (Boolean.TRUE.equals(fraudCase.getEscalated())) {
            return "ESCALATED";
        } else if (now.isAfter(fraudCase.getEscalationDeadline())) {
            return "OVERDUE";
        } else {
            long minutesRemaining = java.time.temporal.ChronoUnit.MINUTES.between(now, fraudCase.getEscalationDeadline());
            return "PENDING_" + minutesRemaining + "m";
        }
    }

    /**
     * Get all non-escalated cases with upcoming deadlines (within next 5 minutes)
     */
    public List<FraudCase> getUrgentCases() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime fiveMinutesLater = now.plusMinutes(5);

        return fraudCaseRepository.findByEscalatedFalseAndEscalationDeadlineBetween(now, fiveMinutesLater);
    }

    /**
     * Get all overdue cases
     */
    public List<FraudCase> getOverdueCases() {
        LocalDateTime now = LocalDateTime.now();
        return fraudCaseRepository.findByEscalatedFalseAndEscalationDeadlineBefore(now);
    }
}
