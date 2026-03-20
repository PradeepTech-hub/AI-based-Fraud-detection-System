package com.example.frauddetectionsystem.controller;

import com.example.frauddetectionsystem.dto.TopUpRequest;
import com.example.frauddetectionsystem.dto.TopUpResponse;
import com.example.frauddetectionsystem.model.User;
import com.example.frauddetectionsystem.model.WalletTopUp;
import com.example.frauddetectionsystem.repository.WalletTopUpRepository;
import com.example.frauddetectionsystem.service.WalletService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/wallet")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;
    private final WalletTopUpRepository walletTopUpRepository;

    @PostMapping("/topup")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TopUpResponse> topUp(@Valid @RequestBody TopUpRequest request,
                                               @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(walletService.topUp(request, user.getId()));
    }

    @GetMapping("/topups")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<WalletTopUp>> myTopUps(@AuthenticationPrincipal User user,
                                                      @RequestParam(defaultValue = "0") int page,
                                                      @RequestParam(defaultValue = "20") int size) {
        int safeSize = Math.min(Math.max(size, 1), 100);
        return ResponseEntity.ok(walletTopUpRepository.findByUserIdOrderByCreatedAtDesc(
                user.getId(), PageRequest.of(Math.max(page, 0), safeSize)
        ));
    }
}

