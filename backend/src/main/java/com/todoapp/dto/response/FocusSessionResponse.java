package com.todoapp.dto.response;

import java.time.LocalDateTime;

public record FocusSessionResponse(
        String id,
        String taskId,
        int durationSeconds,
        LocalDateTime completedAt) {
}
