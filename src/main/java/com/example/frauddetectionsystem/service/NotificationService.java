package com.example.frauddetectionsystem.service;

import com.example.frauddetectionsystem.model.FraudStatus;
import com.example.frauddetectionsystem.model.FraudCase;
import com.example.frauddetectionsystem.model.Transaction;
import com.example.frauddetectionsystem.model.User;
import com.example.frauddetectionsystem.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final Optional<JavaMailSender> mailSender;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate;

    @Value("${spring.mail.username:no-reply@fraudguard.local}")
    private String fromEmail;

    @Value("${app.admin.email:admin@fraudguard.com}")
    private String adminEmail;

    @Value("${app.admin.phone:}")
    private String adminPhone;

    @Value("${app.sms.enabled:false}")
    private boolean smsEnabled;

    @Value("${app.sms.provider.url:}")
    private String smsProviderUrl;

    @Value("${app.sms.provider.api-key:}")
    private String smsProviderApiKey;

    @Value("${app.sms.sender:FraudGuard}")
    private String smsSender;

    public void sendFraudAlertIfNeeded(Transaction transaction) {
        if (transaction.getFraudStatus() != FraudStatus.FRAUD) {
            return;
        }

        userRepository.findById(transaction.getUserId())
                .ifPresent(user -> {
                    sendEmail(
                            user.getEmail(),
                            "[URGENT] Fraudulent Transaction Blocked",
                            buildFraudBody(transaction)
                    );
                    // Urgent channel: SMS
                    sendSms(transaction.getRecipientPhone(), "URGENT: FraudGuard blocked a HIGH risk transaction of INR " + transaction.getAmount());
                });
    }

    public void sendMediumRiskOtpChallenge(User user, Transaction transaction, String otpCode, LocalDateTime expiresAt) {
        String smsText = "FraudGuard OTP: " + otpCode + " for INR " + transaction.getAmount() + ". Expires at " + expiresAt.toLocalTime() + ".";
        sendSms(user.getPhone(), smsText);

        String emailBody = "A medium-risk transaction requires OTP verification.\n\n"
                + "Amount: INR " + transaction.getAmount() + "\n"
                + "Location: " + transaction.getLocation() + "\n"
                + "Risk Score: " + Math.round(transaction.getRiskScore() * 100) + "%\n"
                + "OTP: " + otpCode + "\n"
                + "Expires At: " + expiresAt + "\n\n"
                + "If you did not initiate this, please contact support immediately.";
        sendEmail(user.getEmail(), "OTP Required for Medium-Risk Transaction", emailBody);
    }

    public void sendPhoneVerificationOtp(User user, String phone, String otpCode, LocalDateTime expiresAt) {
        String smsText = "FraudGuard profile verification OTP: " + otpCode + ". Expires at " + expiresAt.toLocalTime() + ".";
        sendSms(phone, smsText);

        String emailBody = "A request was made to verify your phone number for OTP-protected payments.\n\n"
                + "Phone: " + phone + "\n"
                + "OTP: " + otpCode + "\n"
                + "Expires At: " + expiresAt + "\n\n"
                + "If this was not you, please ignore this message.";
        sendEmail(user.getEmail(), "Verify Your FraudGuard Phone Number", emailBody);
    }

    public void sendLowRiskWarning(User user, Transaction transaction) {
        String body = "Your transaction was allowed with low-risk warning.\n\n"
                + "Amount: INR " + transaction.getAmount() + "\n"
                + "Location: " + transaction.getLocation() + "\n"
                + "Risk Score: " + Math.round(transaction.getRiskScore() * 100) + "%\n"
                + "Status: " + transaction.getPaymentStatus() + "\n\n"
                + "This is an informational alert.";
        sendEmail(user.getEmail(), "Low-Risk Transaction Warning", body);
    }

    public void sendCaseEscalationAlert(FraudCase fraudCase) {
        String body = "Fraud case escalated due to SLA.\n\n"
                + "Case ID: " + fraudCase.getId() + "\n"
                + "Transaction ID: " + fraudCase.getTransactionId() + "\n"
                + "Risk Level: " + fraudCase.getRiskLevel() + "\n"
                + "Risk Score: " + Math.round(fraudCase.getRiskScore() * 100) + "%\n"
                + "Reason: " + fraudCase.getReason() + "\n\n"
                + "Please investigate immediately.";

        sendEmail(adminEmail, "[SLA] Fraud Case Escalated", body);
        if (adminPhone != null && !adminPhone.isBlank()) {
            sendSms(adminPhone, "URGENT: Fraud case #" + fraudCase.getId() + " escalated.");
        }
    }

    public void sendBlockNotification(Long userId, Long transactionId, String reason) {
        try {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                log.warn("User not found for block notification: userId={}", userId);
                return;
            }

            User user = userOpt.get();
            String message = String.format("Your transaction has been blocked for security reasons: %s. Please contact support if you believe this is a mistake.", reason);

            sendEmail(user.getEmail(), "Transaction Blocked - Security Alert", message);

            if (user.getPhone() != null && !user.getPhone().isBlank()) {
                sendSms(user.getPhone(), "Your transaction was blocked for security. Contact support for details.");
            }
        } catch (Exception e) {
            log.error("Error sending block notification for userId={}", userId, e);
        }
    }

    private void sendEmail(String toEmail, String subject, String body) {
        try {
            if (mailSender.isEmpty()) {
                log.info("Mail sender not configured; skipping email subject={}", subject);
                return;
            }
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText(body);
            mailSender.get().send(message);
        } catch (Exception ex) {
            log.warn("Failed to send email to {}: {}", toEmail, ex.getMessage());
        }
    }

    private void sendSms(String phoneNumber, String message) {
        if (phoneNumber == null || phoneNumber.isBlank()) {
            return;
        }
        if (!smsEnabled) {
            log.info("SMS disabled; skipping SMS to {}", phoneNumber);
            return;
        }
        if (smsProviderUrl == null || smsProviderUrl.isBlank()) {
            log.info("SMS provider URL missing; skipping SMS to {}", phoneNumber);
            return;
        }

        try {
            restTemplate.postForEntity(
                    smsProviderUrl,
                    Map.of(
                            "to", phoneNumber,
                            "message", message,
                            "sender", smsSender,
                            "apiKey", smsProviderApiKey
                    ),
                    String.class
            );
        } catch (Exception ex) {
            log.warn("Failed to send SMS to {}: {}", phoneNumber, ex.getMessage());
        }
    }

    private String buildFraudBody(Transaction transaction) {
        return "A suspicious transaction was detected.\n\n"
                + "Amount: INR " + transaction.getAmount() + "\n"
                + "Location: " + transaction.getLocation() + "\n"
                + "Risk Score: " + Math.round(transaction.getRiskScore() * 100) + "%\n"
                + "Reason: " + (transaction.getFraudReason() == null ? "N/A" : transaction.getFraudReason()) + "\n\n"
                + "If this was not you, contact FraudGuard support immediately.";
    }
}

