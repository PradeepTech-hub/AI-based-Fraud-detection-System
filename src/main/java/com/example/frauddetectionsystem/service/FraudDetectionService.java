package com.example.frauddetectionsystem.service;

import com.example.frauddetectionsystem.dto.AiPredictionResponse;
import com.example.frauddetectionsystem.dto.RiskAssessmentResult;
import com.example.frauddetectionsystem.model.FraudStatus;
import com.example.frauddetectionsystem.model.TransactionStatus;
import com.example.frauddetectionsystem.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class FraudDetectionService {

    private final RestTemplate restTemplate;
    private final TransactionRepository transactionRepository;

    @Value("${ai.model.url}")
    private String aiModelUrl;

    // High amount threshold for rule-based detection
    private static final double HIGH_AMOUNT_THRESHOLD = 10000.0;
    // Max transactions in 5 minutes before suspicious
    private static final long RAPID_TRANSACTION_LIMIT = 5;
    private static final int RAPID_WINDOW_MINUTES = 5;
    private static final double LOCATION_ANOMALY_BONUS = 0.18;
    private static final double DEVICE_ANOMALY_BONUS = 0.12;

    public RiskAssessmentResult analyzeTransaction(Long userId,
                                                   double amount,
                                                   String location,
                                                   String ipAddress,
                                                   String deviceType,
                                                   String deviceId) {
        LocalDateTime since = LocalDateTime.now().minusMinutes(RAPID_WINDOW_MINUTES);
        long recentCount = transactionRepository.countRecentByUserId(userId, since);
        List<String> reasons = new ArrayList<>();

        // Step 1: Rule-based checks
        double ruleScore = applyRules(amount, recentCount, reasons);

        // Step 1.1: user behavior anomaly checks
        if (isNewLocation(userId, location)) {
            ruleScore += LOCATION_ANOMALY_BONUS;
            reasons.add("Unusual location compared with prior activity");
        }

        if (isNewDevice(userId, deviceId)) {
            ruleScore += DEVICE_ANOMALY_BONUS;
            reasons.add("Unrecognized device fingerprint");
        }

        // Step 2: AI model prediction
        double aiScore = getAiPrediction(amount, location, userId);
        if (aiScore >= 0.75) {
            reasons.add("AI model detected abnormal transaction behavior");
        }

        // Step 3: Combine scores (weighted average)
        double finalScore = (ruleScore * 0.4) + (aiScore * 0.6);

        // Hard business rules override blended model score.
        if (amount > HIGH_AMOUNT_THRESHOLD) {
            finalScore = Math.max(finalScore, 0.9);
        } else if (recentCount >= RAPID_TRANSACTION_LIMIT) {
            finalScore = Math.max(finalScore, 0.45);
        }

        finalScore = Math.min(1.0, Math.max(0.0, finalScore));

        if (reasons.isEmpty()) {
            reasons.add("No major fraud indicators detected");
        }

        return RiskAssessmentResult.builder()
                .riskScore(finalScore)
                .fraudReason(String.join("; ", reasons))
                .build();
    }

    private double applyRules(double amount, long recentCount, List<String> reasons) {
        double score = 0.0;

        // Rule 1: High transaction amount
        if (amount > HIGH_AMOUNT_THRESHOLD) {
            score += 0.7;
            reasons.add("High transaction amount");
            log.info("High amount rule triggered: amount={}", amount);
        } else if (amount > 5000) {
            score += 0.3;
            reasons.add("Above-normal transaction amount");
        }

        // Rule 2: Rapid transaction frequency
        if (recentCount >= RAPID_TRANSACTION_LIMIT) {
            score += 0.5;
            reasons.add("Abnormal transaction frequency");
            log.info("Rapid transaction rule triggered: count={} in last {}min", recentCount, RAPID_WINDOW_MINUTES);
        } else if (recentCount >= 3) {
            score += 0.2;
        }

        return Math.min(1.0, score);
    }

    private double getAiPrediction(double amount, String location, Long userId) {
        try {
            LocalDateTime since = LocalDateTime.now().minusHours(24);
            long txFrequency = transactionRepository.countRecentByUserId(userId, since);

            Map<String, Object> payload = new HashMap<>();
            payload.put("amount", amount);
            payload.put("location", location);
            payload.put("transaction_frequency", txFrequency);

            AiPredictionResponse response = restTemplate.postForObject(
                    aiModelUrl, payload, AiPredictionResponse.class);

            if (response != null) {
                return response.getFraudScore();
            }
        } catch (Exception e) {
            log.warn("AI model unavailable, using rule-based only: {}", e.getMessage());
        }
        return 0.0;
    }

    public FraudStatus determineFraudStatus(double riskScore) {
        double percentage = riskScore * 100.0;
        if (percentage > 70.0) {
            return FraudStatus.FRAUD;
        } else if (percentage >= 40.0) {
            return FraudStatus.SUSPICIOUS;
        } else {
            return FraudStatus.NORMAL;
        }
    }

    public TransactionStatus determineTransactionStatus(double riskScore) {
        double percentage = riskScore * 100.0;
        if (percentage > 80.0) {
            return TransactionStatus.BLOCKED;
        } else if (percentage >= 40.0) {
            return TransactionStatus.UNDER_REVIEW;
        }
        return TransactionStatus.APPROVED;
    }

    private boolean isNewLocation(Long userId, String location) {
        if (location == null || location.isBlank()) {
            return false;
        }
        return !transactionRepository.existsByUserIdAndLocationIgnoreCase(userId, location.trim());
    }

    private boolean isNewDevice(Long userId, String deviceId) {
        if (deviceId == null || deviceId.isBlank()) {
            return false;
        }
        return !transactionRepository.existsByUserIdAndDeviceId(userId, deviceId.trim());
    }
}

