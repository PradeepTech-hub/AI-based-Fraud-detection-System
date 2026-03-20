package com.example.frauddetectionsystem.repository;

import com.example.frauddetectionsystem.model.Notification;
import com.example.frauddetectionsystem.model.NotificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    List<Notification> findByStatusOrderByCreatedAtAsc(NotificationStatus status);
    
    List<Notification> findByStatusAndRetryCountLessThan(NotificationStatus status, Integer retryCount);
    
    List<Notification> findByFraudCaseId(Long fraudCaseId);
    
    List<Notification> findByTransactionId(Long transactionId);
    
    List<Notification> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);
}
