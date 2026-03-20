package com.example.frauddetectionsystem.controller;

import com.example.frauddetectionsystem.dto.AuthResponse;
import com.example.frauddetectionsystem.dto.LoginRequest;
import com.example.frauddetectionsystem.dto.PhoneOtpVerificationRequest;
import com.example.frauddetectionsystem.dto.PhoneUpdateRequest;
import com.example.frauddetectionsystem.dto.RegisterRequest;
import com.example.frauddetectionsystem.dto.UpdateProfileRequest;
import com.example.frauddetectionsystem.dto.UserProfileDTO;
import com.example.frauddetectionsystem.model.User;
import com.example.frauddetectionsystem.service.AuthService;
import com.example.frauddetectionsystem.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserProfileDTO> getProfile(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(userService.getUserProfileByEmail(requireEmail(user)));
    }

    @PutMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserProfileDTO> updateProfile(@AuthenticationPrincipal User user,
                                                        @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(userService.updateUserProfileByEmail(requireEmail(user), request));
    }

    @PostMapping("/profile/phone/send-otp")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> sendPhoneOtp(@AuthenticationPrincipal User user,
                                                             @Valid @RequestBody PhoneUpdateRequest request) {
        return ResponseEntity.ok(userService.requestPhoneVerificationOtpByEmail(requireEmail(user), request.getPhone()));
    }

    @PostMapping("/profile/phone/verify-otp")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserProfileDTO> verifyPhoneOtp(@AuthenticationPrincipal User user,
                                                          @Valid @RequestBody PhoneOtpVerificationRequest request) {
        return ResponseEntity.ok(userService.verifyPhoneOtpByEmail(requireEmail(user), request.getOtp()));
    }

    private String requireEmail(User user) {
        if (user == null || user.getEmail() == null || user.getEmail().isBlank()) {
            throw new BadCredentialsException("Authentication required. Please login again.");
        }
        return user.getEmail();
    }
}

