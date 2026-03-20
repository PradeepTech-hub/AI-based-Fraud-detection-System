package com.example.frauddetectionsystem.config;

import com.example.frauddetectionsystem.model.Role;
import com.example.frauddetectionsystem.model.ModelPerformanceMetric;
import com.example.frauddetectionsystem.model.User;
import com.example.frauddetectionsystem.repository.ModelPerformanceMetricRepository;
import com.example.frauddetectionsystem.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Locale;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataInitializer {

    private final UserRepository userRepository;
    private final ModelPerformanceMetricRepository modelPerformanceMetricRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email:admin@fraudguard.com}")
    private String adminEmail;

    @Value("${app.admin.password:}")
    private String adminPassword;

    @Bean
    public CommandLineRunner seedAdminUser() {
        return args -> {
            String normalizedAdminEmail = adminEmail.trim().toLowerCase(Locale.ROOT);

            User admin = userRepository.findByEmailIgnoreCase(normalizedAdminEmail).orElse(null);

            if (admin == null) {
                if (adminPassword == null || adminPassword.isBlank()) {
                    log.warn("Admin seed skipped: ADMIN_PASSWORD not configured.");
                } else {
                    admin = User.builder().name("System Admin").email(normalizedAdminEmail).build();
                    admin.setRole(Role.ADMIN);
                    admin.setEmail(normalizedAdminEmail);
                    admin.setPassword(passwordEncoder.encode(adminPassword));
                    if (admin.getBalance() == null) {
                        admin.setBalance(100000.0);
                    }
                    userRepository.save(admin);
                    log.info("Seeded admin user for: {}", normalizedAdminEmail);
                }
            } else {
                admin.setRole(Role.ADMIN);
                admin.setEmail(normalizedAdminEmail);
                if (adminPassword != null && !adminPassword.isBlank()) {
                    admin.setPassword(passwordEncoder.encode(adminPassword));
                }
                if (admin.getBalance() == null) {
                    admin.setBalance(100000.0);
                }
                userRepository.save(admin);
                log.info("Ensured admin role for: {}", normalizedAdminEmail);
            }

            if (modelPerformanceMetricRepository.findTopByOrderByCreatedAtDesc().isEmpty()) {
                modelPerformanceMetricRepository.save(ModelPerformanceMetric.builder()
                        .accuracy(0.94)
                        .precision(0.91)
                        .recall(0.89)
                        .f1Score(0.90)
                        .build());
            }
        };
    }
}

