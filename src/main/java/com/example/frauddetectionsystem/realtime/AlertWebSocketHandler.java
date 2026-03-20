package com.example.frauddetectionsystem.realtime;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Slf4j
public class AlertWebSocketHandler extends TextWebSocketHandler {

    private final Set<WebSocketSession> sessions = ConcurrentHashMap.newKeySet();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        sessions.add(session);
        log.info("WebSocket alerts session connected: {}", session.getId());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.remove(session);
        log.info("WebSocket alerts session closed: {}", session.getId());
    }

    public void broadcast(String payload) {
        TextMessage message = new TextMessage(payload);
        sessions.removeIf(session -> {
            if (!session.isOpen()) {
                return true;
            }
            try {
                synchronized (session) {
                    session.sendMessage(message);
                }
                return false;
            } catch (IOException ex) {
                log.warn("Failed sending alert to session {}: {}", session.getId(), ex.getMessage());
                return true;
            }
        });
    }
}
