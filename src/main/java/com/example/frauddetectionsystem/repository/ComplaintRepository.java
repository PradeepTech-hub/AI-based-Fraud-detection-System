package com.example.frauddetectionsystem.repository;

import com.example.frauddetectionsystem.model.Complaint;
import com.example.frauddetectionsystem.model.ComplaintStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ComplaintRepository extends JpaRepository<Complaint, Long> {
    List<Complaint> findByUserId(Long userId);
    List<Complaint> findByStatus(ComplaintStatus status);

    void deleteByUserId(Long userId);
    void deleteByTransactionId(Long transactionId);
}
