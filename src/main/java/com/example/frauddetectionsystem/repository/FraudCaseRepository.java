package com.example.frauddetectionsystem.repository;

import com.example.frauddetectionsystem.model.FraudCase;
import com.example.frauddetectionsystem.model.FraudCaseStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface FraudCaseRepository extends JpaRepository<FraudCase, Long> {
    List<FraudCase> findAllByOrderByCreatedAtDesc();
    Optional<FraudCase> findByTransactionId(Long transactionId);

    List<FraudCase> findByStatusInAndEscalatedFalseAndEscalationDeadlineBefore(
            List<FraudCaseStatus> statuses,
            LocalDateTime deadline
    );

    // SLA-related queries
    List<FraudCase> findByStatus(FraudCaseStatus status);
    
    List<FraudCase> findByEscalatedFalseAndEscalationDeadlineBetween(LocalDateTime start, LocalDateTime end);
    
    List<FraudCase> findByEscalatedFalseAndEscalationDeadlineBefore(LocalDateTime deadline);
    
    List<FraudCase> findByEscalatedTrue();
}

