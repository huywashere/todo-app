package com.todoapp.dto.response;

import java.time.LocalDateTime;

public record SessionResponse(
        String id,
        String deviceName,
        String ipAddress,
        LocalDateTime createdAt,
        LocalDateTime lastUsedAt,
        LocalDateTime expiresAt,
        boolean current) {
}
