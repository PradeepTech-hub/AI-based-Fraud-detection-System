package com.example.frauddetectionsystem.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class FraudCaseSlaScheduler {

    private final FraudCaseService fraudCaseService;

    @Scheduled(fixedDelayString = "${fraud.sla.scheduler.delay.ms:30000}")
    public void escalateDueCases() {
        int escalated = fraudCaseService.escalateDueCases();
        if (escalated > 0) {
            log.info("Escalated {} fraud cases due to SLA deadlines", escalated);
        }
    }
}
