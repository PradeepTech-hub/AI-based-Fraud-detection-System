package com.example.frauddetectionsystem.service;

import com.example.frauddetectionsystem.model.ModelPerformanceMetric;
import com.example.frauddetectionsystem.repository.ModelPerformanceMetricRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class ModelPerformanceService {

    private final ModelPerformanceMetricRepository modelPerformanceMetricRepository;

    public Map<String, Object> getLatestMetrics() {
        ModelPerformanceMetric metric = modelPerformanceMetricRepository.findTopByOrderByCreatedAtDesc()
                .orElse(ModelPerformanceMetric.builder()
                        .accuracy(0.0)
                        .precision(0.0)
                        .recall(0.0)
                        .f1Score(0.0)
                        .build());

        return Map.of(
                "accuracy", metric.getAccuracy(),
                "precision", metric.getPrecision(),
                "recall", metric.getRecall(),
                "f1_score", metric.getF1Score()
        );
    }
}

