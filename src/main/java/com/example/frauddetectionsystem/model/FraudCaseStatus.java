package com.example.frauddetectionsystem.model;

public enum FraudCaseStatus {
    PENDING,                    // Initial state when case is created
    FLAGGED_BY_ANALYST,        // Marked by FRAUD_ANALYST
    ANALYST_REVIEW,            // Under analyst review
    CONFIRMED_FRAUD,           // Confirmed as fraud by ADMIN
    FALSE_POSITIVE,            // Determined to be false positive
    OPEN,                      // Open for investigation
    INVESTIGATING,             // Under investigation
    RESOLVED,                  // Case resolved
    ESCALATED                  // SLA escalated
}

