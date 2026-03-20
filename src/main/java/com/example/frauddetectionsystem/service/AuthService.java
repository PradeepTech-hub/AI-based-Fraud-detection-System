package com.example.frauddetectionsystem.service;

import com.example.frauddetectionsystem.dto.AuthResponse;
import com.example.frauddetectionsystem.dto.LoginRequest;
import com.example.frauddetectionsystem.dto.RegisterRequest;
import com.example.frauddetectionsystem.model.Role;
import com.example.frauddetectionsystem.model.User;
import com.example.frauddetectionsystem.repository.UserRepository;
import com.example.frauddetectionsystem.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;

import java.util.Locale;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private static final String DEFAULT_BANK_NAME = "FraudGuard Payments Bank";
    private static final String DEFAULT_BANK_IFSC = "FRGD0001024";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    @Value("${app.default-user-balance:10000}")
    private Double defaultUserBalance;

    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new IllegalArgumentException("Email already registered: " + normalizedEmail);
        }

        User user = User.builder()
                .name(request.getName())
                .email(normalizedEmail)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.USER)
                .balance(defaultUserBalance)
            .bankName(DEFAULT_BANK_NAME)
            .bankIfsc(DEFAULT_BANK_IFSC)
            .bankAccountNumber(generateVirtualAccountNumber())
                .build();

        userRepository.saveAndFlush(user);
        log.info("User registered successfully: {}", normalizedEmail);

        String token = jwtUtil.generateToken(user);
        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole().name())
                .userId(user.getId())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(normalizedEmail, request.getPassword())
            );
        } catch (Exception ex) {
            log.warn("Login failed for email: {}", normalizedEmail);
            throw new BadCredentialsException("Invalid email or password");
        }

        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String token = jwtUtil.generateToken(user);
        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole().name())
                .userId(user.getId())
                .build();
    }

    private String normalizeEmail(String email) {
        if (email == null) {
            return "";
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String generateVirtualAccountNumber() {
        long randomNumber = ThreadLocalRandom.current().nextLong(100000000000L, 999999999999L);
        return String.valueOf(randomNumber);
    }
}

