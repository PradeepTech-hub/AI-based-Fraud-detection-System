package com.example.frauddetectionsystem.repository;

import com.example.frauddetectionsystem.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);

    @Query("SELECT COALESCE(SUM(u.balance), 0) FROM User u")
    Double getTotalBalance();
}

