package com.example.frauddetectionsystem.repository;

import com.example.frauddetectionsystem.model.WalletTopUp;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WalletTopUpRepository extends JpaRepository<WalletTopUp, Long> {

    Page<WalletTopUp> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
}

