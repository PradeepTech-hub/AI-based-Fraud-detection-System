package com.example.frauddetectionsystem.dto;

import com.example.frauddetectionsystem.model.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDTO {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private Boolean phoneVerified;
    private String bankName;
    private String bankAccountNumber;
    private String bankIfsc;
    private Role role;
    private Double balance;
    private Boolean accountLocked;
    private LocalDateTime createdAt;
}

