package com.todoapp.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record CreateFocusSessionRequest(
        String taskId,
        @Min(60) @Max(14400) int durationSeconds) {
}
