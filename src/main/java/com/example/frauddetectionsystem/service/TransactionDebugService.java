package com.example.frauddetectionsystem.service;

import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@Slf4j
public class TransactionDebugService {

    @Getter
    public static class LastError {
        private final Instant at;
        private final String requestId;
        private final String summary;
        private final String exceptionClass;
        private final String message;

        public LastError(Instant at, String requestId, String summary, String exceptionClass, String message) {
            this.at = at;
            this.requestId = requestId;
            this.summary = summary;
            this.exceptionClass = exceptionClass;
            this.message = message;
        }
    }

    private volatile LastError lastError;

    public void record(String requestId, String summary, Exception ex) {
        this.lastError = new LastError(
                Instant.now(),
                requestId,
                summary,
                ex.getClass().getName(),
                ex.getMessage()
        );
        log.error("Recorded last transaction error reqId={}, summary={}", requestId, summary, ex);
    }

    public LastError getLastError() {
        return lastError;
    }
}

