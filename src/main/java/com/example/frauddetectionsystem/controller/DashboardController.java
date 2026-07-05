package com.example.frauddetectionsystem.controller;

import com.example.frauddetectionsystem.dto.DashboardStatsDTO;
import com.example.frauddetectionsystem.model.Role;
import com.example.frauddetectionsystem.model.User;
import com.example.frauddetectionsystem.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsDTO> getStats(@AuthenticationPrincipal User user) {
        boolean canSeeGlobalStats = user != null
                && (user.getRole() == Role.ADMIN || user.getRole() == Role.FRAUD_ANALYST);
        if (canSeeGlobalStats) {
            return ResponseEntity.ok(dashboardService.getDashboardStats());
        }
        return ResponseEntity.ok(dashboardService.getDashboardStatsForUser(user.getId()));
    }
}

