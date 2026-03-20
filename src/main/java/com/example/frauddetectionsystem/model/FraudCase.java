package com.example.frauddetectionsystem.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "fraud_cases")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FraudCase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "transaction_id", nullable = false, unique = true)
    private Long transactionId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "risk_score", nullable = false)
    private Double riskScore;

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level", nullable = false, length = 20)
    private RiskLevel riskLevel;

    @Column(nullable = false, length = 500)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FraudCaseStatus status;

    @Column(name = "analyst_notes", length = 1000)
    private String analystNotes;

    @Column(name = "escalation_deadline")
    private LocalDateTime escalationDeadline;

    @Column(name = "escalated", nullable = false)
    private Boolean escalated;

    @Column(name = "escalated_at")
    private LocalDateTime escalatedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
        if (escalated == null) {
            escalated = false;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

