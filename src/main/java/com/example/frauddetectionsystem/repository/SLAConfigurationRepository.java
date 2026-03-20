package com.example.frauddetectionsystem.repository;

import com.example.frauddetectionsystem.model.RiskLevel;
import com.example.frauddetectionsystem.model.SLAConfiguration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SLAConfigurationRepository extends JpaRepository<SLAConfiguration, Long> {
    Optional<SLAConfiguration> findByRiskLevel(RiskLevel riskLevel);
    
    Optional<SLAConfiguration> findByRiskLevelAndEnabledTrue(RiskLevel riskLevel);
}
