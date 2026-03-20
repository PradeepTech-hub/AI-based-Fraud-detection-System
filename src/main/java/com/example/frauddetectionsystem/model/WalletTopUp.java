package com.example.frauddetectionsystem.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "wallet_topups")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WalletTopUp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Double amount;

    @Column(length = 64)
    private String reference;

    @Column(length = 30)
    private String method;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}

