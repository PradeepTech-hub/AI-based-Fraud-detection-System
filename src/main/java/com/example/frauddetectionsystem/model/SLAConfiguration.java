package com.example.frauddetectionsystem.model;

import jakarta.persistence.*;
import lombok.*;

/**
 * SLA Configuration for fraud case escalation based on risk level
 */
@Entity
@Table(name = "sla_configuration")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SLAConfiguration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true)
    private RiskLevel riskLevel;

    @Column(name = "escalation_minutes", nullable = false)
    private Integer escalationMinutes;

    @Column(nullable = false)
    private Boolean enabled;

    @Column(length = 500)
    private String description;

    public static SLAConfiguration getDefault(RiskLevel riskLevel) {
        return switch (riskLevel) {
            case HIGH -> SLAConfiguration.builder()
                    .riskLevel(RiskLevel.HIGH)
                    .escalationMinutes(5)
                    .enabled(true)
                    .description("High risk transactions require immediate escalation within 5 minutes")
                    .build();
            case MEDIUM -> SLAConfiguration.builder()
                    .riskLevel(RiskLevel.MEDIUM)
                    .escalationMinutes(15)
                    .enabled(true)
                    .description("Medium risk transactions require escalation within 15 minutes")
                    .build();
            case LOW -> SLAConfiguration.builder()
                    .riskLevel(RiskLevel.LOW)
                    .escalationMinutes(30)
                    .enabled(true)
                    .description("Low risk transactions require escalation within 30 minutes")
                    .build();
        };
    }
}
