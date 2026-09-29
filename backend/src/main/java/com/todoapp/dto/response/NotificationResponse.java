package com.todoapp.dto.response;

import java.time.LocalDateTime;

public record NotificationResponse(
        String id,
        String taskId,
        String title,
        String message,
        LocalDateTime readAt,
        LocalDateTime createdAt) {
}
