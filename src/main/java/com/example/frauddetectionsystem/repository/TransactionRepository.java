package com.example.frauddetectionsystem.repository;

import com.example.frauddetectionsystem.model.FraudStatus;
import com.example.frauddetectionsystem.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    List<Transaction> findByUserId(Long userId);

    List<Transaction> findByFraudStatus(FraudStatus fraudStatus);

    List<Transaction> findByFraudStatusIn(List<FraudStatus> statuses);

    List<Transaction> findByUserIdAndTimestampBetween(Long userId, LocalDateTime start, LocalDateTime end);

    List<Transaction> findByLocationIgnoreCase(String location);

    boolean existsByUserIdAndLocationIgnoreCase(Long userId, String location);

    boolean existsByUserIdAndDeviceId(Long userId, String deviceId);

    long countByFraudStatus(FraudStatus fraudStatus);

    List<Transaction> findTop10ByOrderByTimestampDesc();

    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.userId = :userId AND t.timestamp >= :since")
    long countRecentByUserId(Long userId, LocalDateTime since);

    @Query("SELECT FUNCTION('DATE', t.timestamp), COUNT(t) FROM Transaction t GROUP BY FUNCTION('DATE', t.timestamp) ORDER BY FUNCTION('DATE', t.timestamp)")
    List<Object[]> countTransactionsPerDay();

    @Query("SELECT t.location, COUNT(t) FROM Transaction t WHERE t.fraudStatus IN :statuses GROUP BY t.location ORDER BY COUNT(t) DESC")
    List<Object[]> countFraudByLocation(List<FraudStatus> statuses);

    @Query("SELECT DISTINCT t.location FROM Transaction t WHERE t.location IS NOT NULL AND TRIM(t.location) <> '' ORDER BY t.location")
    List<String> findDistinctLocations();

    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.riskScore < 0.4")
    long countLowRisk();

    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.riskScore >= 0.4 AND t.riskScore <= 0.7")
    long countMediumRisk();

    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.riskScore > 0.7")
    long countHighRisk();

    void deleteByUserId(Long userId);
}

