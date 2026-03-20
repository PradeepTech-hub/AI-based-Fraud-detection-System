package com.example.frauddetectionsystem.repository;

import com.example.frauddetectionsystem.model.ModelPerformanceMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ModelPerformanceMetricRepository extends JpaRepository<ModelPerformanceMetric, Long> {
    Optional<ModelPerformanceMetric> findTopByOrderByCreatedAtDesc();
}

