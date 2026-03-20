package com.example.frauddetectionsystem.service;

import com.example.frauddetectionsystem.dto.TopUpRequest;
import com.example.frauddetectionsystem.dto.TopUpResponse;
import com.example.frauddetectionsystem.model.User;
import com.example.frauddetectionsystem.model.WalletTopUp;
import com.example.frauddetectionsystem.repository.UserRepository;
import com.example.frauddetectionsystem.repository.WalletTopUpRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WalletService {

    private final UserRepository userRepository;
    private final WalletTopUpRepository walletTopUpRepository;
    private final JdbcTemplate jdbcTemplate;

    @Transactional
    public TopUpResponse topUp(TopUpRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        // In a real system we'd integrate with a payment gateway.
        // Here we always mark success.
        String status = "SUCCESS";
        String method = request.getMethod();
        String reference = (request.getReference() == null || request.getReference().isBlank())
                ? generateReference()
                : request.getReference().trim();

        WalletTopUp saved = walletTopUpRepository.save(
                WalletTopUp.builder()
                        .userId(userId)
                        .amount(request.getAmount())
                        .reference(reference)
                        .method(method)
                        .status(status)
                        .createdAt(LocalDateTime.now())
                        .build()
        );

        // Atomic increment to avoid lost updates under concurrent top-ups.
        int updated = jdbcTemplate.update(
                "UPDATE users SET balance = COALESCE(balance, 0) + ? WHERE id = ?",
                request.getAmount(), userId
        );
        if (updated != 1) {
            throw new IllegalArgumentException("Failed to update wallet balance for user: " + userId);
        }
        // Refresh user balance from DB within the same transaction
        User refreshed = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        return TopUpResponse.builder()
                .id(saved.getId())
                .userId(userId)
                .amount(request.getAmount())
                .method(method)
                .reference(reference)
                .status(status)
                .createdAt(saved.getCreatedAt())
                .newBalance(refreshed.getBalance())
                .message("Balance added successfully")
                .build();
    }


    private String generateReference() {
        return "TOP" + UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase();
    }
}

