package com.example.frauddetectionsystem.service;

import com.example.frauddetectionsystem.model.FraudCase;
import com.example.frauddetectionsystem.model.FraudCaseStatus;
import com.example.frauddetectionsystem.repository.FraudCaseRepository;
import com.example.frauddetectionsystem.realtime.AlertWebSocketHandler;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AlertPublisherService {

    private final AlertWebSocketHandler alertWebSocketHandler;
    private final FraudCaseRepository fraudCaseRepository;
    private final ObjectMapper objectMapper;

    /**
     * Publish alerts every 5 seconds to all connected WebSocket clients
     * This provides real-time push notifications for fraud alerts
     */
    @Scheduled(fixedRate = 5000) // Every 5 seconds
    public void publishRealtimeAlerts() {
        try {
            // Get all pending and escalated cases
            List<FraudCase> pendingCases = fraudCaseRepository.findByStatus(FraudCaseStatus.PENDING);
            List<FraudCase> flaggedCases = fraudCaseRepository.findByStatus(FraudCaseStatus.FLAGGED_BY_ANALYST);
            List<FraudCase> escalatedCases = fraudCaseRepository.findByEscalatedTrue();

            // Build alert message
            Map<String, Object> alertMessage = new HashMap<>();
            alertMessage.put("type", "FRAUD_ALERT_UPDATE");
            alertMessage.put("timestamp", System.currentTimeMillis());
            alertMessage.put("pending_count", pendingCases.size());
            alertMessage.put("flagged_count", flaggedCases.size());
            alertMessage.put("escalated_count", escalatedCases.size());
            alertMessage.put("total_cases", pendingCases.size() + flaggedCases.size() + escalatedCases.size());

            // Add urgent cases (overdue escalations)
            java.time.LocalDateTime now = java.time.LocalDateTime.now();
            List<FraudCase> overdueCases = fraudCaseRepository.findByEscalatedFalseAndEscalationDeadlineBefore(now);
            if (!overdueCases.isEmpty()) {
                alertMessage.put("overdue_cases", overdueCases.size());
                alertMessage.put("urgent", true);
            }

            // Broadcast to all connected clients
            String jsonMessage = objectMapper.writeValueAsString(alertMessage);
            alertWebSocketHandler.broadcast(jsonMessage);

            if (pendingCases.size() + flaggedCases.size() > 0) {
                log.debug("Published alert update: {} pending, {} flagged, {} escalated", 
                        pendingCases.size(), flaggedCases.size(), escalatedCases.size());
            }

        } catch (Exception e) {
            log.error("Error publishing real-time alerts", e);
        }
    }

    /**
     * Publish new fraud alert immediately
     */
    public void publishFraudAlert(FraudCase fraudCase) {
        try {
            Map<String, Object> alert = new HashMap<>();
            alert.put("type", "NEW_FRAUD_ALERT");
            alert.put("timestamp", System.currentTimeMillis());
            alert.put("case_id", fraudCase.getId());
            alert.put("transaction_id", fraudCase.getTransactionId());
            alert.put("user_id", fraudCase.getUserId());
            alert.put("risk_level", fraudCase.getRiskLevel());
            alert.put("risk_score", fraudCase.getRiskScore());
            alert.put("reason", fraudCase.getReason());

            String jsonMessage = objectMapper.writeValueAsString(alert);
            alertWebSocketHandler.broadcast(jsonMessage);

            log.info("Published new fraud alert for case {}", fraudCase.getId());

        } catch (Exception e) {
            log.error("Error publishing fraud alert for case {}", fraudCase.getId(), e);
        }
    }

    /**
     * Publish escalation alert
     */
    public void publishEscalationAlert(FraudCase fraudCase) {
        try {
            Map<String, Object> alert = new HashMap<>();
            alert.put("type", "CASE_ESCALATED");
            alert.put("timestamp", System.currentTimeMillis());
            alert.put("case_id", fraudCase.getId());
            alert.put("transaction_id", fraudCase.getTransactionId());
            alert.put("reason", "SLA escalation deadline reached");
            alert.put("escalated_at", fraudCase.getEscalatedAt());

            String jsonMessage = objectMapper.writeValueAsString(alert);
            alertWebSocketHandler.broadcast(jsonMessage);

            log.info("Published escalation alert for case {}", fraudCase.getId());

        } catch (Exception e) {
            log.error("Error publishing escalation alert for case {}", fraudCase.getId(), e);
        }
    }

    /**
     * Publish case status update
     */
    public void publishCaseStatusUpdate(FraudCase fraudCase) {
        try {
            Map<String, Object> update = new HashMap<>();
            update.put("type", "CASE_STATUS_UPDATE");
            update.put("timestamp", System.currentTimeMillis());
            update.put("case_id", fraudCase.getId());
            update.put("status", fraudCase.getStatus());
            update.put("escalated", fraudCase.getEscalated());

            String jsonMessage = objectMapper.writeValueAsString(update);
            alertWebSocketHandler.broadcast(jsonMessage);

            log.info("Published case status update for case {} with status {}", 
                    fraudCase.getId(), fraudCase.getStatus());

        } catch (Exception e) {
            log.error("Error publishing case status update for case {}", fraudCase.getId(), e);
        }
    }
}
