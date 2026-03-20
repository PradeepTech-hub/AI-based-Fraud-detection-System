package com.example.frauddetectionsystem.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "model_performance_metrics")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ModelPerformanceMetric {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Double accuracy;

    @Column(nullable = false)
    private Double precision;

    @Column(nullable = false)
    private Double recall;

    @Column(name = "f1_score", nullable = false)
    private Double f1Score;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}

