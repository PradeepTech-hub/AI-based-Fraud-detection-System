package com.example.frauddetectionsystem.controller;

import com.example.frauddetectionsystem.dto.UserProfileDTO;
import com.example.frauddetectionsystem.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUsersController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','FRAUD_ANALYST')")
    public ResponseEntity<List<UserProfileDTO>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN','FRAUD_ANALYST')")
    public ResponseEntity<UserProfileDTO> getUser(@PathVariable Long userId) {
        return ResponseEntity.ok(userService.getUserProfile(userId));
    }

    @PostMapping("/{userId}/block")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> blockUser(@PathVariable Long userId) {
        UserProfileDTO result = userService.lockUser(userId);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "User blocked successfully.");
        response.put("data", result);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{userId}/unblock")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> unblockUser(@PathVariable Long userId) {
        UserProfileDTO result = userService.unlockUser(userId);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "User unblocked successfully.");
        response.put("data", result);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> deleteUser(@PathVariable Long userId) {
        userService.deleteUser(userId);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "User deleted successfully.");
        return ResponseEntity.ok(response);
    }
}
