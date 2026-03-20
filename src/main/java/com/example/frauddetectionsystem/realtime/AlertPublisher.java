package com.example.frauddetectionsystem.realtime;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AlertPublisher {

    private final AlertWebSocketHandler alertWebSocketHandler;
    private final ObjectMapper objectMapper;

    public void publish(String type, Object payload) {
        Map<String, Object> envelope = Map.of(
                "type", type,
                "timestamp", LocalDateTime.now().toString(),
                "payload", payload
        );

        try {
            alertWebSocketHandler.broadcast(objectMapper.writeValueAsString(envelope));
        } catch (JsonProcessingException ex) {
            log.warn("Failed to serialize websocket alert payload: {}", ex.getMessage());
        }
    }
}
