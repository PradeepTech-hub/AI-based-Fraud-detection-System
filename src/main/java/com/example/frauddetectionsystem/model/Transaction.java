package com.example.frauddetectionsystem.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Double amount;

    @Column(nullable = false)
    private String location;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime timestamp;

    // Backward compatibility for older schemas that still use `timestamp`.
    @Column(name = "timestamp")
    private LocalDateTime legacyTimestamp;

    @Enumerated(EnumType.STRING)
    @Column(name = "fraud_status", nullable = false)
    private FraudStatus fraudStatus;

    @Column(name = "risk_score", nullable = false)
    private Double riskScore;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_status", nullable = false)
    private TransactionStatus transactionStatus;

    // Backward compatibility for older databases that still have `status` as NOT NULL.
    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private TransactionStatus legacyStatus;

    @Column(name = "fraud_reason", length = 500)
    private String fraudReason;

    @Column(name = "ip_address", length = 64)
    private String ipAddress;

    @Column(name = "device_type", length = 100)
    private String deviceType;

    @Column(name = "device_id", length = 120)
    private String deviceId;

    // Realistic payment details (demo)
    @Column(name = "recipient_phone", length = 15)
    private String recipientPhone;

    @Column(name = "payment_method", length = 30)
    private String paymentMethod;

    @Column(name = "upi_vpa", length = 100)
    private String upiVpa;

    @Column(name = "merchant_name", length = 120)
    private String merchantName;

    @Column(name = "payment_reference", length = 64)
    private String paymentReference;

    @Column(name = "payment_status", nullable = false, length = 30)
    private String paymentStatus;

    @Column(name = "is_debited", nullable = false)
    private Boolean debited;

    @PrePersist
    @PreUpdate
    protected void onCreate() {
        if (timestamp == null && legacyTimestamp != null) {
            timestamp = legacyTimestamp;
        }
        if (timestamp == null) {
            timestamp = LocalDateTime.now();
        }
        if (timestamp != null) {
            legacyTimestamp = timestamp;
        }
        if (debited == null) {
            debited = false;
        }
        if (paymentStatus == null || paymentStatus.isBlank()) {
            paymentStatus = "INITIATED";
        }
        if (transactionStatus == null && legacyStatus != null) {
            transactionStatus = legacyStatus;
        }
        if (transactionStatus != null) {
            legacyStatus = transactionStatus;
        }
    }
}

