package com.example.frauddetectionsystem.service;

import com.example.frauddetectionsystem.dto.UserProfileDTO;
import com.example.frauddetectionsystem.dto.UpdateProfileRequest;
import com.example.frauddetectionsystem.model.User;
import com.example.frauddetectionsystem.repository.ComplaintRepository;
import com.example.frauddetectionsystem.repository.TransactionRepository;
import com.example.frauddetectionsystem.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private static final String DEFAULT_BANK_NAME = "FraudGuard Payments Bank";
    private static final String DEFAULT_BANK_IFSC = "FRGD0001024";

    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final ComplaintRepository complaintRepository;
    private final NotificationService notificationService;

    @Value("${profile.phone.otp.expiry.minutes:10}")
    private int phoneOtpExpiryMinutes;

    @Value("${app.otp.dev-mode:true}")
    private boolean otpDevMode;

    @Value("${app.otp.show-in-response:true}")
    private boolean otpShowInResponse;

    private final Map<Long, PhoneOtpChallenge> phoneOtpChallenges = new ConcurrentHashMap<>();

    public UserProfileDTO getUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        return mapToDTO(user);
    }

    public UserProfileDTO getUserProfileByEmail(String email) {
         User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
        return mapToDTO(user);
    }

    public List<UserProfileDTO> getAllUsers() {
        return userRepository.findAll()
                .stream().map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public UserProfileDTO updateUserProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        String normalizedEmail = request.getEmail().trim().toLowerCase(Locale.ROOT);
        userRepository.findByEmailIgnoreCase(normalizedEmail)
                .filter(existing -> !existing.getId().equals(userId))
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("Email is already used by another account");
                });

        user.setName(request.getName().trim());
        user.setEmail(normalizedEmail);
        if (request.getBankName() != null && !request.getBankName().isBlank()) {
            user.setBankName(normalizeBankName(request.getBankName()));
        }
        if (request.getBankAccountNumber() != null && !request.getBankAccountNumber().isBlank()) {
            user.setBankAccountNumber(normalizeAccountNumber(request.getBankAccountNumber()));
        }
        if (request.getBankIfsc() != null && !request.getBankIfsc().isBlank()) {
            user.setBankIfsc(normalizeIfsc(request.getBankIfsc()));
        }

        ensureBankDefaults(user);

        return mapToDTO(userRepository.save(user));
    }

    public UserProfileDTO updateUserProfileByEmail(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
        return updateUserProfile(user.getId(), request);
    }

    public Map<String, Object> requestPhoneVerificationOtp(Long userId, String rawPhone) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        String phone = normalizePhone(rawPhone);
        String otp = generateOtp();
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(Math.max(phoneOtpExpiryMinutes, 1));

        phoneOtpChallenges.put(userId, new PhoneOtpChallenge(phone, otp, expiresAt));
        notificationService.sendPhoneVerificationOtp(user, phone, otp, expiresAt);

        if (otpDevMode) {
            log.info("DEV OTP (phone verification) userId={}, phone={}, otp={}, expiresAt={}", userId, phone, otp, expiresAt);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("message", "OTP sent to the provided phone number.");
        response.put("phone", maskPhone(phone));
        response.put("expiresAt", expiresAt);
        if (otpDevMode && otpShowInResponse) {
            response.put("demoOtp", otp);
        }
        return response;
    }

    public Map<String, Object> requestPhoneVerificationOtpByEmail(String email, String rawPhone) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
        return requestPhoneVerificationOtp(user.getId(), rawPhone);
    }

    public UserProfileDTO verifyPhoneOtp(Long userId, String otp) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        PhoneOtpChallenge challenge = phoneOtpChallenges.get(userId);
        if (challenge == null || challenge.isExpired() || !challenge.otp().equals(otp)) {
            throw new IllegalArgumentException("Invalid or expired OTP.");
        }

        user.setPhone(challenge.phone());
        user.setPhoneVerified(true);
        user.setPhoneVerifiedAt(LocalDateTime.now());
        phoneOtpChallenges.remove(userId);

        return mapToDTO(userRepository.save(user));
    }

    public UserProfileDTO verifyPhoneOtpByEmail(String email, String otp) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
        return verifyPhoneOtp(user.getId(), otp);
    }

    public UserProfileDTO lockUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        user.setAccountLocked(true);
        return mapToDTO(userRepository.save(user));
    }

    public UserProfileDTO unlockUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        user.setAccountLocked(false);
        return mapToDTO(userRepository.save(user));
    }

    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        if (user.getRole() != null && "ADMIN".equalsIgnoreCase(user.getRole().name())) {
            throw new IllegalArgumentException("Admin account cannot be deleted.");
        }

        complaintRepository.deleteByUserId(userId);
        transactionRepository.deleteByUserId(userId);
        userRepository.delete(user);
    }

    private UserProfileDTO mapToDTO(User user) {
        ensureBankDefaults(user);
        return UserProfileDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .phoneVerified(Boolean.TRUE.equals(user.getPhoneVerified()))
                .bankName(user.getBankName())
                .bankAccountNumber(user.getBankAccountNumber())
                .bankIfsc(user.getBankIfsc())
                .role(user.getRole())
                .balance(user.getBalance())
                .accountLocked(Boolean.TRUE.equals(user.getAccountLocked()))
                .createdAt(user.getCreatedAt())
                .build();
    }

    private String normalizePhone(String phone) {
        if (phone == null) {
            throw new IllegalArgumentException("Phone number is required.");
        }
        String normalized = phone.trim();
        if (!normalized.matches("^[6-9]\\d{9}$")) {
            throw new IllegalArgumentException("Phone number must be a valid 10-digit Indian mobile number.");
        }
        return normalized;
    }

    private String generateOtp() {
        int number = ThreadLocalRandom.current().nextInt(100000, 1000000);
        return String.valueOf(number);
    }

    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 4) {
            return "****";
        }
        return "******" + phone.substring(phone.length() - 4);
    }

    private void ensureBankDefaults(User user) {
        if (user.getBankName() == null || user.getBankName().isBlank()) {
            user.setBankName(DEFAULT_BANK_NAME);
        }
        if (user.getBankIfsc() == null || user.getBankIfsc().isBlank()) {
            user.setBankIfsc(DEFAULT_BANK_IFSC);
        }
        if (user.getBankAccountNumber() == null || user.getBankAccountNumber().isBlank()) {
            String userIdPart = user.getId() == null ? "000000" : String.valueOf(user.getId());
            user.setBankAccountNumber("900001" + userIdPart);
        }
    }

    private String normalizeBankName(String value) {
        String normalized = value.trim();
        if (normalized.isEmpty()) {
            throw new IllegalArgumentException("Bank name cannot be empty.");
        }
        return normalized;
    }

    private String normalizeAccountNumber(String value) {
        String normalized = value.replaceAll("\\s+", "").trim();
        if (!normalized.matches("^\\d{8,30}$")) {
            throw new IllegalArgumentException("Bank account number must be 8 to 30 digits.");
        }
        return normalized;
    }

    private String normalizeIfsc(String value) {
        String normalized = value.replaceAll("\\s+", "").toUpperCase(Locale.ROOT);
        if (!normalized.matches("^[A-Z]{4}0[A-Z0-9]{6}$")) {
            throw new IllegalArgumentException("Invalid IFSC format.");
        }
        return normalized;
    }

    private record PhoneOtpChallenge(String phone, String otp, LocalDateTime expiresAt) {
        boolean isExpired() {
            return LocalDateTime.now().isAfter(expiresAt);
        }
    }
}

