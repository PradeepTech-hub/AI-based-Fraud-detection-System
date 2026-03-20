package com.example.frauddetectionsystem.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.dao.DataAccessException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientException;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;

import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException ex) {
    String message = ex.getBindingResult()
        .getFieldErrors()
        .stream()
        .findFirst()
        .map(fieldError -> fieldError.getDefaultMessage() != null
            ? fieldError.getDefaultMessage()
            : "Invalid value for field: " + fieldError.getField())
        .orElse("Invalid request data.");

    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
        .body(Map.of("message", message));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, String>> handleConstraintViolation(ConstraintViolationException ex) {
    String message = ex.getConstraintViolations()
        .stream()
        .findFirst()
        .map(v -> v.getMessage() != null ? v.getMessage() : "Invalid request data.")
        .orElse("Invalid request data.");

    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
        .body(Map.of("message", message));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, String>> handleBadCredentials(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<Map<String, String>> handleDataAccess(DataAccessException ex) {
        log.error("Database error", ex);
        // Provide a short, user-friendly message. Avoid leaking SQL.
        String specific = ex.getMostSpecificCause() != null ? ex.getMostSpecificCause().getMessage() : null;
        String msg = toUserMessage(specific != null ? specific : ex.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", msg));
    }

    @ExceptionHandler({ResourceAccessException.class})
    public ResponseEntity<Map<String, String>> handleResourceAccess(ResourceAccessException ex) {
        log.error("Downstream service not reachable", ex);
        // Typically: AI service / downstream dependency not reachable
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of("message", "Service is temporarily unavailable. Please try again."));
    }

    @ExceptionHandler(RestClientException.class)
    public ResponseEntity<Map<String, String>> handleRestClient(RestClientException ex) {
        log.error("Downstream REST call failed", ex);
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(Map.of("message", "Unable to process transaction right now. Please try again."));
    }

    private String toUserMessage(String raw) {
        if (raw == null) {
            return "Something went wrong while processing your request. Please try again.";
        }
        String r = raw.toLowerCase();

        if (r.contains("insufficient") && r.contains("fund")) {
            return "Insufficient balance to complete this transaction.";
        }
        if (r.contains("violates not-null constraint") || r.contains("not null constraint")) {
            return "Payment could not be processed right now. Please try again.";
        }
        if (r.contains("wallet_topups") && r.contains("does not exist")) {
            return "Add balance is temporarily unavailable. Please restart the server and try again.";
        }
        if (r.contains("transactions") && r.contains("does not exist")) {
            return "Transactions service is not ready. Please restart the server and try again.";
        }
        if (r.contains("connection") && (r.contains("refused") || r.contains("timeout"))) {
            return "Cannot reach the server right now. Please try again.";
        }

        return "Something went wrong while processing your request. Please try again.";
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleUnknown(Exception ex) {
        log.error("Unhandled error", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Unable to process this request right now. Please try again."));
    }
}

