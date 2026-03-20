package com.example.frauddetectionsystem.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationChannel channel; // EMAIL or SMS

    @Column(nullable = false)
    private String recipient; // Email or phone number

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type; // FRAUD_ALERT, OTP_VERIFICATION, TRANSACTION_WARNING, CASE_UPDATE

    @Column(name = "fraud_case_id")
    private Long fraudCaseId;

    @Column(name = "transaction_id")
    private Long transactionId;

    @Column(nullable = false, length = 500)
    private String subject;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationStatus status; // PENDING, SENT, FAILED

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "failed_reason", length = 500)
    private String failedReason;

    @Column(name = "retry_count", nullable = false)
    private Integer retryCount;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
        if (retryCount == null) {
            retryCount = 0;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
