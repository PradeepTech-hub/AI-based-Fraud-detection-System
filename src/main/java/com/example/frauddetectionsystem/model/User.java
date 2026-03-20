package com.example.frauddetectionsystem.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column
    private Double balance;

    @Column(name = "account_locked", nullable = false)
    private Boolean accountLocked;

    @Column(name = "phone", length = 15)
    private String phone;

    @Column(name = "phone_verified")
    private Boolean phoneVerified;

    @Column(name = "phone_verified_at")
    private LocalDateTime phoneVerifiedAt;

    @Column(name = "bank_name", length = 120)
    private String bankName;

    @Column(name = "bank_account_number", length = 30)
    private String bankAccountNumber;

    @Column(name = "bank_ifsc", length = 20)
    private String bankIfsc;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    @PreUpdate
    protected void normalizeDefaults() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (balance == null) {
            balance = 0.0;
        }
        if (accountLocked == null) {
            accountLocked = false;
        }
        if (phoneVerified == null) {
            phoneVerified = false;
        }
    }

    @Override
    public String getUsername() {
        return email;
    }

    public Double getBalance() {
        return balance == null ? 0.0 : balance;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return !Boolean.TRUE.equals(accountLocked); }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return true; }
}

