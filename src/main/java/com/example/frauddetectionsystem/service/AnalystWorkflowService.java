package com.example.frauddetectionsystem.service;

import com.example.frauddetectionsystem.model.*;
import com.example.frauddetectionsystem.repository.FraudCaseRepository;
import com.example.frauddetectionsystem.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalystWorkflowService {

    private final FraudCaseRepository fraudCaseRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    /**
     * Fraud Analyst: Review and flag a transaction
     * FRAUD_ANALYST role can only flag, not resolve
     */
    public void analyzeAndFlagTransaction(Long caseId, String analystNotes, Boolean isFraud, Long analystId) {
        try {
            // Verify analyst has correct role
            Optional<User> analystOpt = userRepository.findById(analystId);
            if (analystOpt.isEmpty() || analystOpt.get().getRole() != Role.FRAUD_ANALYST) {
                log.error("Unauthorized: User {} is not a FRAUD_ANALYST", analystId);
                return;
            }

            Optional<FraudCase> caseOpt = fraudCaseRepository.findById(caseId);
            if (caseOpt.isEmpty()) {
                log.error("Fraud case {} not found", caseId);
                return;
            }

            FraudCase fraudCase = caseOpt.get();

            // FRAUD_ANALYST can only add notes and flag
            fraudCase.setAnalystNotes(analystNotes);

            if (Boolean.TRUE.equals(isFraud)) {
                fraudCase.setStatus(FraudCaseStatus.FLAGGED_BY_ANALYST);
                log.info("Case {} flagged as fraud by analyst {}", caseId, analystId);
                notificationService.sendFraudAlertIfNeeded(null); // Notify admins
            } else {
                fraudCase.setStatus(FraudCaseStatus.ANALYST_REVIEW);
                log.info("Case {} flagged for further review by analyst {}", caseId, analystId);
            }

            fraudCase.setUpdatedAt(LocalDateTime.now());
            fraudCaseRepository.save(fraudCase);

        } catch (Exception e) {
            log.error("Error flagging case {}", caseId, e);
        }
    }

    /**
     * Admin: Resolve fraud case (approve or reject)
     */
    public void resolveFraudCase(Long caseId, Boolean isConfirmedFraud, String adminNotes, Long adminId) {
        try {
            // Verify user is ADMIN
            Optional<User> adminOpt = userRepository.findById(adminId);
            if (adminOpt.isEmpty() || adminOpt.get().getRole() != Role.ADMIN) {
                log.error("Unauthorized: User {} is not an ADMIN", adminId);
                return;
            }

            Optional<FraudCase> caseOpt = fraudCaseRepository.findById(caseId);
            if (caseOpt.isEmpty()) {
                log.error("Fraud case {} not found", caseId);
                return;
            }

            FraudCase fraudCase = caseOpt.get();

            if (Boolean.TRUE.equals(isConfirmedFraud)) {
                fraudCase.setStatus(FraudCaseStatus.CONFIRMED_FRAUD);
                log.info("Case {} CONFIRMED as fraud by admin {}", caseId, adminId);
            } else {
                fraudCase.setStatus(FraudCaseStatus.FALSE_POSITIVE);
                log.info("Case {} resolved as FALSE POSITIVE by admin {}", caseId, adminId);
            }

            fraudCase.setAnalystNotes(adminNotes);
            fraudCase.setUpdatedAt(LocalDateTime.now());
            fraudCaseRepository.save(fraudCase);

        } catch (Exception e) {
            log.error("Error resolving case {}", caseId, e);
        }
    }

    /**
     * Admin: Block user account
     */
    public void blockUserAccount(Long userId, String blockReason) {
        try {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                log.error("User {} not found", userId);
                return;
            }

            User user = userOpt.get();
            user.setAccountLocked(true);
            userRepository.save(user);

            log.info("User {} account blocked. Reason: {}", userId, blockReason);

            // Send block notification
            notificationService.sendBlockNotification(userId, null, blockReason);

        } catch (Exception e) {
            log.error("Error blocking user {}", userId, e);
        }
    }

    /**
     * Admin: Unblock user account
     */
    public void unblockUserAccount(Long userId, String reason) {
        try {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                log.error("User {} not found", userId);
                return;
            }

            User user = userOpt.get();
            user.setAccountLocked(false);
            userRepository.save(user);

            log.info("User {} account unblocked. Reason: {}", userId, reason);

        } catch (Exception e) {
            log.error("Error unblocking user {}", userId, e);
        }
    }

    /**
     * Fraud Analyst: Get assigned cases for review
     */
    public List<FraudCase> getAnalystCases(Long analystId) {
        // Return cases that need analyst review
        return fraudCaseRepository.findByStatus(FraudCaseStatus.PENDING);
    }

    /**
     * Admin: Get all cases for resolution
     */
    public List<FraudCase> getAdminCases() {
        // Return all cases that need admin action
        List<FraudCase> cases = fraudCaseRepository.findByStatus(FraudCaseStatus.FLAGGED_BY_ANALYST);
        cases.addAll(fraudCaseRepository.findByStatus(FraudCaseStatus.ANALYST_REVIEW));
        return cases;
    }

    /**
     * Fraud Analyst: View fraud case details
     */
    public Optional<FraudCaseDetails> getCaseDetails(Long caseId, Long userId) {
        Optional<FraudCase> caseOpt = fraudCaseRepository.findById(caseId);
        if (caseOpt.isEmpty()) {
            return Optional.empty();
        }

        FraudCase fraudCase = caseOpt.get();
        return Optional.of(new FraudCaseDetails(
                fraudCase.getId(),
                fraudCase.getTransactionId(),
                fraudCase.getUserId(),
                fraudCase.getRiskLevel(),
                fraudCase.getRiskScore(),
                fraudCase.getStatus(),
                fraudCase.getReason(),
                fraudCase.getAnalystNotes(),
                fraudCase.getEscalated(),
                fraudCase.getEscalatedAt(),
                fraudCase.getCreatedAt(),
                fraudCase.getUpdatedAt()
        ));
    }

    /**
     * DTO for fraud case details
     */
    public record FraudCaseDetails(
            Long id,
            Long transactionId,
            Long userId,
            RiskLevel riskLevel,
            Double riskScore,
            FraudCaseStatus status,
            String reason,
            String analystNotes,
            Boolean escalated,
            LocalDateTime escalatedAt,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {}

    /**
     * Get workflow statistics for dashboard
     */
    public AnalystWorkflowStats getWorkflowStats() {
        long pendingCount = fraudCaseRepository.findByStatus(FraudCaseStatus.PENDING).size();
        long flaggedCount = fraudCaseRepository.findByStatus(FraudCaseStatus.FLAGGED_BY_ANALYST).size();
        long resolvedCount = fraudCaseRepository.findByStatus(FraudCaseStatus.CONFIRMED_FRAUD).size();
        long falsePositiveCount = fraudCaseRepository.findByStatus(FraudCaseStatus.FALSE_POSITIVE).size();

        return new AnalystWorkflowStats(
                pendingCount,
                flaggedCount,
                resolvedCount,
                falsePositiveCount
        );
    }

    /**
     * Workflow statistics DTO
     */
    public record AnalystWorkflowStats(
            long pendingCount,
            long flaggedCount,
            long resolvedCount,
            long falsePositiveCount
    ) {}
}
