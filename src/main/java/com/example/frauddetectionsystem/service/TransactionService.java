package com.example.frauddetectionsystem.service;

import com.example.frauddetectionsystem.dto.TransactionRequest;
import com.example.frauddetectionsystem.dto.TransactionResponse;
import com.example.frauddetectionsystem.dto.RiskAssessmentResult;
import com.example.frauddetectionsystem.model.FraudStatus;
import com.example.frauddetectionsystem.model.RiskLevel;
import com.example.frauddetectionsystem.model.Transaction;
import com.example.frauddetectionsystem.model.TransactionStatus;
import com.example.frauddetectionsystem.model.User;
import com.example.frauddetectionsystem.realtime.AlertPublisher;
import com.example.frauddetectionsystem.repository.ComplaintRepository;
import com.example.frauddetectionsystem.repository.TransactionRepository;
import com.example.frauddetectionsystem.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final FraudDetectionService fraudDetectionService;
    private final FraudCaseService fraudCaseService;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final ComplaintRepository complaintRepository;
    private final AlertPublisher alertPublisher;

    @Value("${transaction.otp.expiry.seconds:90}")
    private int otpExpirySeconds;

    @Value("${app.otp.dev-mode:true}")
    private boolean otpDevMode;

    @Value("${app.otp.show-in-response:true}")
    private boolean otpShowInResponse;

    private final Map<Long, OtpChallenge> otpChallenges = new ConcurrentHashMap<>();

    @Transactional
    public TransactionResponse createTransaction(TransactionRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        if (Boolean.TRUE.equals(user.getAccountLocked())) {
            throw new IllegalArgumentException("Your account has been locked by the administrator. Please contact support.");
        }

        RiskAssessmentResult assessment = fraudDetectionService.analyzeTransaction(
                userId,
                request.getAmount(),
                request.getLocation(),
                request.getIpAddress(),
                request.getDeviceType(),
                request.getDeviceId()
        );
        double riskScore = assessment.getRiskScore();
        RiskLevel riskLevel = determineRiskLevel(riskScore);
        FraudStatus fraudStatus = fraudDetectionService.determineFraudStatus(riskScore);
        TransactionStatus transactionStatus = fraudDetectionService.determineTransactionStatus(riskScore);

        boolean requiresOtp = riskLevel == RiskLevel.MEDIUM || riskLevel == RiskLevel.HIGH;
        if (requiresOtp) {
            fraudStatus = FraudStatus.SUSPICIOUS;
            transactionStatus = TransactionStatus.UNDER_REVIEW;
        }

        Transaction transaction = Transaction.builder()
                .userId(userId)
                .amount(request.getAmount())
                .location(request.getLocation())
                .fraudStatus(fraudStatus)
                .transactionStatus(transactionStatus)
                .riskScore(riskScore)
                .fraudReason(assessment.getFraudReason())
                .ipAddress(request.getIpAddress())
                .deviceType(request.getDeviceType())
                .deviceId(request.getDeviceId())
                .recipientPhone(normalize(request.getRecipientPhone()))
                .paymentMethod(normalize(request.getPaymentMethod()))
                .upiVpa(normalize(request.getUpiVpa()))
                .merchantName(normalize(request.getMerchantName()))
                .paymentReference(generatePaymentReference())
                .paymentStatus(deriveInitialPaymentStatus(transactionStatus))
                .debited(false)
                .build();

        String paymentOtp = null;
        if (!requiresOtp && transactionStatus == TransactionStatus.APPROVED) {
            debitUserBalance(user, transaction);
        } else if (requiresOtp) {
            if (!Boolean.TRUE.equals(user.getPhoneVerified()) || user.getPhone() == null || user.getPhone().isBlank()) {
                throw new IllegalArgumentException("Please verify your phone number in profile before submitting suspicious/large payments.");
            }
            transaction.setPaymentStatus("OTP_REQUIRED");
            paymentOtp = generateOtp();
        }

        Transaction saved = transactionRepository.save(transaction);
        if (requiresOtp) {
            LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(Math.max(otpExpirySeconds, 15));
            otpChallenges.put(saved.getId(), new OtpChallenge(paymentOtp, expiresAt));
            notificationService.sendMediumRiskOtpChallenge(user, saved, paymentOtp, expiresAt);
        }

        userRepository.save(user);
        try {
            fraudCaseService.openOrUpdateCaseForTransaction(saved);
        } catch (Exception ex) {
            log.warn("Fraud case update skipped for transaction {}: {}", saved.getId(), ex.getMessage());
        }
        try {
            notificationService.sendFraudAlertIfNeeded(saved);
        } catch (Exception ex) {
            log.warn("Fraud notification skipped for transaction {}: {}", saved.getId(), ex.getMessage());
        }

        if (riskLevel == RiskLevel.LOW) {
            notificationService.sendLowRiskWarning(user, saved);
        }

        alertPublisher.publish("TRANSACTION_CREATED", mapToResponse(saved, null));
        log.info("Transaction saved: id={}, status={}, txnStatus={}, risk={}", saved.getId(), fraudStatus, transactionStatus, riskScore);

        String message = switch (fraudStatus) {
            case FRAUD -> "Transaction flagged as FRAUDULENT and blocked for investigation.";
            case SUSPICIOUS -> requiresOtp
                    ? "Transaction requires OTP verification within " + Math.max(otpExpirySeconds, 15) + " seconds. If not verified in time, it will be marked as fraud."
                    : "Transaction is SUSPICIOUS. Under review.";
            case NORMAL -> transactionStatus == TransactionStatus.APPROVED
                    ? "Transaction processed with low-risk warning. Updated balance: INR " + String.format("%.2f", user.getBalance())
                    : "Transaction recorded and pending review.";
        };

        TransactionResponse response = mapToResponse(saved, message);
        if (requiresOtp && otpDevMode && otpShowInResponse) {
            response.setDemoOtp(paymentOtp);
        }
        return response;
    }

    /**
     * Used by UI polling to show a "real" payment progression.
     */
    @Transactional
    public TransactionResponse getTransactionByIdForUser(Long transactionId, Long userId) {
        Transaction transaction = getByIdOrThrow(transactionId);
        if (!transaction.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Transaction not found: " + transactionId);
        }

        if (markFraudIfOtpExpired(transaction)) {
            Transaction expiredSaved = transactionRepository.save(transaction);
            return mapToResponse(expiredSaved, "OTP expired. Transaction has been marked as fraud and blocked.");
        }

        maybeAdvancePaymentStatus(transaction);
        Transaction saved = transactionRepository.save(transaction);
        return mapToResponse(saved, null);
    }

    public List<TransactionResponse> getAllTransactions() {
        return transactionRepository.findAll()
            .stream()
                .map(t -> {
                    if (markFraudIfOtpExpired(t)) {
                        return transactionRepository.save(t);
                    }
                    return t;
                })
            .map(t -> mapToResponse(t, null))
                .collect(Collectors.toList());
    }

    public List<TransactionResponse> getTransactionsByUser(Long userId) {
        return transactionRepository.findByUserId(userId)
                .stream()
                .map(t -> {
                    if (markFraudIfOtpExpired(t)) {
                        return transactionRepository.save(t);
                    }
                    return t;
                })
                .map(t -> mapToResponse(t, null))
                .collect(Collectors.toList());
    }

    public List<TransactionResponse> getFraudTransactions() {
        return transactionRepository.findByFraudStatusIn(List.of(FraudStatus.FRAUD, FraudStatus.SUSPICIOUS))
                .stream()
                .map(t -> {
                    if (markFraudIfOtpExpired(t)) {
                        return transactionRepository.save(t);
                    }
                    return t;
                })
                .map(t -> mapToResponse(t, null))
                .collect(Collectors.toList());
    }

    public List<TransactionResponse> getFraudTransactionsByUser(Long userId) {
        return transactionRepository.findByUserId(userId)
                .stream()
                .map(t -> {
                    if (markFraudIfOtpExpired(t)) {
                        return transactionRepository.save(t);
                    }
                    return t;
                })
                .filter(t -> t.getFraudStatus() == FraudStatus.FRAUD || t.getFraudStatus() == FraudStatus.SUSPICIOUS)
                .map(t -> mapToResponse(t, null))
                .collect(Collectors.toList());
    }

    public List<TransactionResponse> getRecentTransactions() {
        return transactionRepository.findTop10ByOrderByTimestampDesc()
                .stream()
                .map(t -> {
                    if (markFraudIfOtpExpired(t)) {
                        return transactionRepository.save(t);
                    }
                    return t;
                })
                .map(t -> mapToResponse(t, null))
                .collect(Collectors.toList());
    }

    @Transactional
    public TransactionResponse approveTransaction(Long transactionId) {
        Transaction transaction = getByIdOrThrow(transactionId);
        User user = userRepository.findById(transaction.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + transaction.getUserId()));

        if (!Boolean.TRUE.equals(transaction.getDebited())) {
            debitUserBalance(user, transaction);
            userRepository.save(user);
        }

        transaction.setTransactionStatus(TransactionStatus.APPROVED);
        transaction.setFraudStatus(FraudStatus.NORMAL);
        if (transaction.getTimestamp() == null) {
            transaction.setTimestamp(LocalDateTime.now());
        }
        if (transaction.getPaymentStatus() == null
                || transaction.getPaymentStatus().isBlank()
                || "ON_HOLD".equalsIgnoreCase(transaction.getPaymentStatus())
                || "OTP_REQUIRED".equalsIgnoreCase(transaction.getPaymentStatus())) {
            transaction.setPaymentStatus("INITIATED");
        }
        Transaction saved = transactionRepository.save(transaction);
        alertPublisher.publish("TRANSACTION_APPROVED", mapToResponse(saved, null));
        return mapToResponse(saved, "Transaction approved by admin. Funds transfer has been initiated.");
    }

    public TransactionResponse blockTransaction(Long transactionId) {
        Transaction transaction = getByIdOrThrow(transactionId);
        transaction.setTransactionStatus(TransactionStatus.BLOCKED);
        transaction.setFraudStatus(FraudStatus.FRAUD);
        if (transaction.getFraudReason() == null || transaction.getFraudReason().isBlank()) {
            transaction.setFraudReason("Manually blocked by administrator");
        }
        Transaction saved = transactionRepository.save(transaction);
        fraudCaseService.openOrUpdateCaseForTransaction(saved);
        notificationService.sendFraudAlertIfNeeded(saved);
        alertPublisher.publish("TRANSACTION_BLOCKED", mapToResponse(saved, null));
        return mapToResponse(saved, "Transaction blocked by admin");
    }

    @Transactional
    public TransactionResponse verifyMediumRiskOtp(Long transactionId, Long userId, String otp) {
        Transaction transaction = getByIdOrThrow(transactionId);
        if (!transaction.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Transaction not found: " + transactionId);
        }
        if (!"OTP_REQUIRED".equalsIgnoreCase(transaction.getPaymentStatus())) {
            throw new IllegalArgumentException("OTP verification is not required for this transaction.");
        }

        OtpChallenge challenge = otpChallenges.get(transactionId);
        if (challenge == null) {
            throw new IllegalArgumentException("Invalid or expired OTP.");
        }
        if (challenge.isExpired()) {
            transitionOtpTimeoutToFraud(transaction);
            transactionRepository.save(transaction);
            throw new IllegalArgumentException("OTP expired. Transaction has been marked as fraud.");
        }
        if (!challenge.code().equals(otp)) {
            throw new IllegalArgumentException("Invalid or expired OTP.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        transaction.setTransactionStatus(TransactionStatus.APPROVED);
        transaction.setFraudStatus(FraudStatus.NORMAL);
        transaction.setTimestamp(LocalDateTime.now());
        transaction.setPaymentStatus("INITIATED");
        debitUserBalance(user, transaction);

        otpChallenges.remove(transactionId);

        Transaction saved = transactionRepository.save(transaction);
        userRepository.save(user);
        alertPublisher.publish("TRANSACTION_OTP_VERIFIED", mapToResponse(saved, null));
        return mapToResponse(saved, "OTP verified. Transaction is now being processed.");
    }

    @Transactional
    public TransactionResponse markSuspiciousTransaction(Long transactionId, String notes) {
        Transaction transaction = getByIdOrThrow(transactionId);
        transaction.setFraudStatus(FraudStatus.SUSPICIOUS);
        transaction.setTransactionStatus(TransactionStatus.UNDER_REVIEW);
        transaction.setPaymentStatus("ON_HOLD");
        if (notes != null && !notes.isBlank()) {
            transaction.setFraudReason(notes.trim());
        } else if (transaction.getFraudReason() == null || transaction.getFraudReason().isBlank()) {
            transaction.setFraudReason("Marked suspicious by analyst");
        }
        Transaction saved = transactionRepository.save(transaction);
        fraudCaseService.openOrUpdateCaseForTransaction(saved);
        alertPublisher.publish("TRANSACTION_MARKED_SUSPICIOUS", mapToResponse(saved, null));
        return mapToResponse(saved, "Transaction marked as suspicious for investigation.");
    }

    @Transactional
    public void deleteTransaction(Long transactionId) {
        Transaction transaction = getByIdOrThrow(transactionId);
        complaintRepository.deleteByTransactionId(transactionId);
        transactionRepository.delete(transaction);
    }

    @Transactional
    public long deleteAllTransactions() {
        long count = transactionRepository.count();
        complaintRepository.deleteAllInBatch();
        transactionRepository.deleteAllInBatch();
        return count;
    }

    private Transaction getByIdOrThrow(Long transactionId) {
        return transactionRepository.findById(transactionId)
                .orElseThrow(() -> new IllegalArgumentException("Transaction not found: " + transactionId));
    }

    private String normalize(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    private String generatePaymentReference() {
        return "PAY" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
    }

    private String deriveInitialPaymentStatus(TransactionStatus txnStatus) {
        return txnStatus == TransactionStatus.APPROVED ? "INITIATED" : "ON_HOLD";
    }

    private boolean markFraudIfOtpExpired(Transaction transaction) {
        if (!"OTP_REQUIRED".equalsIgnoreCase(transaction.getPaymentStatus())) {
            return false;
        }

        OtpChallenge challenge = otpChallenges.get(transaction.getId());
        if (challenge == null || !challenge.isExpired()) {
            return false;
        }

        transitionOtpTimeoutToFraud(transaction);
        return true;
    }

    private void transitionOtpTimeoutToFraud(Transaction transaction) {
        transaction.setTransactionStatus(TransactionStatus.BLOCKED);
        transaction.setFraudStatus(FraudStatus.FRAUD);
        transaction.setPaymentStatus("ON_HOLD");
        if (transaction.getFraudReason() == null || transaction.getFraudReason().isBlank()) {
            transaction.setFraudReason("OTP verification window expired");
        } else if (!transaction.getFraudReason().toLowerCase().contains("otp")) {
            transaction.setFraudReason(transaction.getFraudReason() + "; OTP verification window expired");
        }
        otpChallenges.remove(transaction.getId());
    }

    private void maybeAdvancePaymentStatus(Transaction transaction) {
        if (transaction.getTransactionStatus() != TransactionStatus.APPROVED) {
            if (transaction.getPaymentStatus() == null || transaction.getPaymentStatus().isBlank()) {
                transaction.setPaymentStatus("ON_HOLD");
            }
            return;
        }

        if (transaction.getTimestamp() == null) {
            transaction.setTimestamp(LocalDateTime.now());
        }

        long seconds = Duration.between(transaction.getTimestamp(), LocalDateTime.now()).getSeconds();
        String current = transaction.getPaymentStatus() == null ? "INITIATED" : transaction.getPaymentStatus();

        if ("SUCCESS".equalsIgnoreCase(current) || "FAILED".equalsIgnoreCase(current)) {
            return;
        }

        if (seconds >= 6) {
            transaction.setPaymentStatus("SUCCESS");
        } else if (seconds >= 2) {
            transaction.setPaymentStatus("PROCESSING");
        } else {
            transaction.setPaymentStatus("INITIATED");
        }
    }

    private void debitUserBalance(User user, Transaction transaction) {
        if (Boolean.TRUE.equals(transaction.getDebited())) {
            return;
        }

        if (user.getBalance() < transaction.getAmount()) {
            throw new IllegalArgumentException("Insufficient balance. Available: INR " + String.format("%.2f", user.getBalance()));
        }

        user.setBalance(user.getBalance() - transaction.getAmount());
        transaction.setDebited(true);
    }

    public TransactionResponse mapToResponse(Transaction t, String message) {
        String userName = userRepository.findById(t.getUserId())
                .map(User::getName)
                .orElse(null);

        OtpChallenge challenge = otpChallenges.get(t.getId());

        TransactionResponse response = TransactionResponse.builder()
                .id(t.getId())
                .userId(t.getUserId())
                .userName(userName)
                .amount(t.getAmount())
                .location(t.getLocation())
                .timestamp(t.getTimestamp())
                .fraudStatus(t.getFraudStatus())
                .transactionStatus(t.getTransactionStatus())
                .riskScore(t.getRiskScore())
                .riskLevel(determineRiskLevel(t.getRiskScore()))
                .fraudReason(t.getFraudReason())
                .ipAddress(t.getIpAddress())
                .deviceType(t.getDeviceType())
                .deviceId(t.getDeviceId())
                .recipientPhone(t.getRecipientPhone())
                .paymentMethod(t.getPaymentMethod())
                .upiVpa(t.getUpiVpa())
                .merchantName(t.getMerchantName())
                .paymentReference(t.getPaymentReference())
                .paymentStatus(t.getPaymentStatus())
                .otpRequired("OTP_REQUIRED".equalsIgnoreCase(t.getPaymentStatus()))
                .debited(t.getDebited())
                .remainingBalance(getUserBalance(t.getUserId()))
                .message(message)
                .build();

            if (otpDevMode
                && otpShowInResponse
                && "OTP_REQUIRED".equalsIgnoreCase(t.getPaymentStatus())
                && challenge != null
                && !challenge.isExpired()) {
                response.setDemoOtp(challenge.code());
            }

            return response;
    }

    private Double getUserBalance(Long userId) {
        return userRepository.findById(userId)
                .map(User::getBalance)
                .orElse(0.0);
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

    private String generateOtp() {
        int number = ThreadLocalRandom.current().nextInt(100000, 1000000);
        return String.valueOf(number);
    }

    private record OtpChallenge(String code, LocalDateTime expiresAt) {
        boolean isExpired() {
            return LocalDateTime.now().isAfter(expiresAt);
        }
    }
}

