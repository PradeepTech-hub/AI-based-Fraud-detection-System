package com.example.frauddetectionsystem.controller;

import com.example.frauddetectionsystem.dto.ComplaintRequest;
import com.example.frauddetectionsystem.dto.ComplaintResponse;
import com.example.frauddetectionsystem.dto.TransactionRequest;
import com.example.frauddetectionsystem.dto.TransactionResponse;
import com.example.frauddetectionsystem.dto.OtpVerificationRequest;
import com.example.frauddetectionsystem.model.User;
import com.example.frauddetectionsystem.service.ComplaintService;
import com.example.frauddetectionsystem.service.TransactionDebugService;
import com.example.frauddetectionsystem.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
@Slf4j
public class TransactionController {

    private final TransactionService transactionService;
    private final ComplaintService complaintService;
    private final TransactionDebugService transactionDebugService;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TransactionResponse> createTransaction(
            @Valid @RequestBody TransactionRequest request,
            @AuthenticationPrincipal User user) {
        String reqId = UUID.randomUUID().toString().substring(0, 8);
        if (user == null || user.getId() == null) {
            throw new IllegalArgumentException("Authentication required. Please login again.");
        }
        try {
            return ResponseEntity.ok(transactionService.createTransaction(request, user.getId()));
        } catch (Exception ex) {
            // Log full details server-side; UI gets sanitized message via GlobalExceptionHandler.
            log.error("Transaction create failed reqId={}, userId={}, amount={}, location={}, paymentMethod={}",
                    reqId, user != null ? user.getId() : null, request.getAmount(), request.getLocation(), request.getPaymentMethod(), ex);
            transactionDebugService.record(
                    reqId,
                    "userId=" + (user != null ? user.getId() : null)
                            + ", amount=" + request.getAmount()
                            + ", location=" + request.getLocation()
                            + ", method=" + request.getPaymentMethod(),
                    ex
            );
            throw ex;
        }
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','FRAUD_ANALYST')")
    public ResponseEntity<List<TransactionResponse>> getAllTransactions() {
        return ResponseEntity.ok(transactionService.getAllTransactions());
    }

    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('USER','ADMIN','FRAUD_ANALYST')")
    public ResponseEntity<List<TransactionResponse>> getMyTransactions(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(transactionService.getTransactionsByUser(user.getId()));
    }

    @GetMapping("/my/{transactionId}")
    @PreAuthorize("hasAnyRole('USER','ADMIN','FRAUD_ANALYST')")
    public ResponseEntity<TransactionResponse> getMyTransactionById(@PathVariable Long transactionId,
                                                                    @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(transactionService.getTransactionByIdForUser(transactionId, user.getId()));
    }

    @PostMapping("/my/{transactionId}/verify-otp")
    @PreAuthorize("hasAnyRole('USER','ADMIN','FRAUD_ANALYST')")
    public ResponseEntity<TransactionResponse> verifyOtp(@PathVariable Long transactionId,
                                                         @AuthenticationPrincipal User user,
                                                         @Valid @RequestBody OtpVerificationRequest request) {
        return ResponseEntity.ok(transactionService.verifyMediumRiskOtp(transactionId, user.getId(), request.getOtp()));
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN','FRAUD_ANALYST')")
    public ResponseEntity<List<TransactionResponse>> getTransactionsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(transactionService.getTransactionsByUser(userId));
    }

    @GetMapping("/fraud")
    @PreAuthorize("hasAnyRole('USER','ADMIN','FRAUD_ANALYST')")
    public ResponseEntity<List<TransactionResponse>> getFraudTransactions(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(transactionService.getFraudTransactionsByUser(user.getId()));
    }

    @PostMapping("/{transactionId}/report")
    @PreAuthorize("hasAnyRole('USER','ADMIN','FRAUD_ANALYST')")
    public ResponseEntity<ComplaintResponse> reportTransaction(@PathVariable Long transactionId,
                                                               @AuthenticationPrincipal User user,
                                                               @Valid @RequestBody ComplaintRequest request) {
        if (!transactionId.equals(request.getTransactionId())) {
            throw new IllegalArgumentException("Transaction ID mismatch in request.");
        }
        return ResponseEntity.ok(complaintService.submitComplaint(user.getId(), request));
    }

    @GetMapping("/my/complaints")
    @PreAuthorize("hasAnyRole('USER','ADMIN','FRAUD_ANALYST')")
    public ResponseEntity<List<ComplaintResponse>> getMyComplaints(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(complaintService.getComplaintsForUser(user.getId()));
    }

    @GetMapping("/recent")
    @PreAuthorize("hasAnyRole('ADMIN','FRAUD_ANALYST')")
    public ResponseEntity<List<TransactionResponse>> getRecentTransactions() {
        return ResponseEntity.ok(transactionService.getRecentTransactions());
    }
}

