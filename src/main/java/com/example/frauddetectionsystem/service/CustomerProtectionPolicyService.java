package com.example.frauddetectionsystem.service;

import com.example.frauddetectionsystem.model.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomerProtectionPolicyService {

    private final NotificationService notificationService;
    private final TransactionService transactionService;

    /**
     * Determine the action to take based on risk level
     */
    public TransactionPolicyAction determinePolicy(Transaction transaction, RiskLevel riskLevel, Double riskScore) {
        switch (riskLevel) {
            case HIGH:
                return handleHighRiskTransaction(transaction);
            case MEDIUM:
                return handleMediumRiskTransaction(transaction);
            case LOW:
                return handleLowRiskTransaction(transaction);
            default:
                return new TransactionPolicyAction(
                        ActionType.REQUIRE_VERIFICATION,
                        "Unknown risk level",
                        false
                );
        }
    }

    /**
     * Handle HIGH risk transactions: Auto-block
     */
    private TransactionPolicyAction handleHighRiskTransaction(Transaction transaction) {
        log.info("Applying HIGH risk policy to transaction {}", transaction.getId());

        // Block the transaction
        transaction.setTransactionStatus(TransactionStatus.BLOCKED);
        transaction.setPaymentStatus("BLOCKED_BY_FRAUD_DETECTION");
        transaction.setFraudReason("High-risk fraud pattern detected - Transaction automatically blocked");

        // Send block notification
        notificationService.sendFraudAlertIfNeeded(transaction);

        return new TransactionPolicyAction(
                ActionType.AUTO_BLOCK,
                "HIGH risk transaction - Automatically blocked",
                true
        );
    }

    /**
     * Handle MEDIUM risk transactions: Require OTP verification
     */
    private TransactionPolicyAction handleMediumRiskTransaction(Transaction transaction) {
        log.info("Applying MEDIUM risk policy (OTP) to transaction {}", transaction.getId());

        // Hold the transaction pending OTP verification
        transaction.setTransactionStatus(TransactionStatus.OTP_PENDING);
        transaction.setPaymentStatus("OTP_REQUIRED");

        // Generate and send OTP
        String otp = generateOTP();
        java.time.LocalDateTime otpExpiry = java.time.LocalDateTime.now().plusMinutes(10);

        // Send OTP notification
        notificationService.sendMediumRiskOtpChallenge(
                new User(), // Would need to fetch actual user
                transaction,
                otp,
                otpExpiry
        );

        return new TransactionPolicyAction(
                ActionType.REQUIRE_OTP,
                "MEDIUM risk detected - OTP verification required",
                false
        );
    }

    /**
     * Handle LOW risk transactions: Allow with warning
     */
    private TransactionPolicyAction handleLowRiskTransaction(Transaction transaction) {
        log.info("Applying LOW risk policy (warning) to transaction {}", transaction.getId());

        // Allow the transaction but send warning
        transaction.setTransactionStatus(TransactionStatus.COMPLETED);
        transaction.setPaymentStatus("SUCCESS_WITH_WARNING");

        // Send low-risk warning notification
        notificationService.sendLowRiskWarning(
                new User(), // Would need to fetch actual user
                transaction
        );

        return new TransactionPolicyAction(
                ActionType.ALLOW_WITH_WARNING,
                "LOW risk detected - Transaction allowed with warning",
                false
        );
    }

    /**
     * Generate OTP code
     */
    private String generateOTP() {
        return String.format("%06d", (int) (Math.random() * 1000000));
    }

    /**
     * Verify OTP for a transaction
     */
    public boolean verifyOTP(Transaction transaction, String providedOTP, String storedOTP, java.time.LocalDateTime otpExpiry) {
        java.time.LocalDateTime now = java.time.LocalDateTime.now();

        if (now.isAfter(otpExpiry)) {
            log.warn("OTP expired for transaction {}", transaction.getId());
            return false;
        }

        if (!storedOTP.equals(providedOTP)) {
            log.warn("Invalid OTP provided for transaction {}", transaction.getId());
            return false;
        }

        log.info("OTP verified successfully for transaction {}", transaction.getId());
        transaction.setTransactionStatus(TransactionStatus.COMPLETED);
        transaction.setPaymentStatus("SUCCESS_AFTER_OTP");
        return true;
    }

    /**
     * Get policy description for UI display
     */
    public String getPolicyDescription(RiskLevel riskLevel) {
        return switch (riskLevel) {
            case HIGH -> "High-Risk Policy: Transaction will be automatically blocked for your protection";
            case MEDIUM -> "Medium-Risk Policy: OTP verification required for your security";
            case LOW -> "Low-Risk Policy: Transaction allowed with informational warning";
            default -> "Unknown policy";
        };
    }

    /**
     * Represent the action to be taken for a transaction
     */
    public static class TransactionPolicyAction {
        public final ActionType actionType;
        public final String message;
        public final boolean isBlocked;

        public TransactionPolicyAction(ActionType actionType, String message, boolean isBlocked) {
            this.actionType = actionType;
            this.message = message;
            this.isBlocked = isBlocked;
        }
    }

    public enum ActionType {
        AUTO_BLOCK("Transaction automatically blocked"),
        REQUIRE_OTP("OTP verification required"),
        ALLOW_WITH_WARNING("Allowed but with warning"),
        REQUIRE_VERIFICATION("Additional verification needed");

        public final String description;

        ActionType(String description) {
            this.description = description;
        }
    }
}
